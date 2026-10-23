import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  buildInstances,
  buildNetwork,
  configFrom,
  createPulses,
  renderNetworkTestSvg,
  rollNetworkTestConfig,
  seedFor,
} from '@modules/networkTest';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import NETWORK_TEST_POST from './post';
import createNetworkRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 2),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
// A source image without a typed imageShare is drawn alone.
// `loadImage(source, max)` decodes it to RGBA (sharp in the CLI, a canvas
// in the page).
export async function networkAt({ batch, index, loadImage, roll }) {
  const name = seedFor(batch, index);
  const config = rollNetworkTestConfig(name, roll);
  if (config.sourceImage && roll.pinned.imageShare == null) {
    config.imageShare = 1;
  }
  const image =
    config.sourceImage && config.imageShare > 0
      ? await loadImage(config.sourceImage, SOURCE_IMAGE_MAX)
      : null;
  return {
    config,
    name,
    network: buildNetwork(config, { image }),
    stops: getPaletteStops(config.paletteName),
  };
}

// What sticks out of a point: node sprites, and in a drift clip the
// furthest a point can wander.
export function padFor({ config }, { drift = false } = {}) {
  const unit = Math.min(config.domainX, config.domainY, config.domainZ);
  return (
    Math.max(config.nodeSize, config.pulseSize) +
    (drift ? config.driftAmount * unit * 1.5 : 0)
  );
}

// A settled network with its signals advanced to `seconds`.
export function settledInstances(drawn, seconds) {
  const { config, network, stops } = drawn;
  const pulses = createPulses(config.wireSeed, config.pulseCount);
  pulses.advance(network, network.positions, seconds, config.pulseSpeed);
  return buildInstances({ config, network, pulses: pulses.pulses, stops });
}

// The plot of a network: its wires, settled, through the view's camera.
export function networkSvg(drawn, view, options) {
  return renderNetworkTestSvg({
    camera: view,
    config: drawn.config,
    depthPens: options.svgDepthPens,
    height: options.height,
    instances: buildInstances({
      config: drawn.config,
      network: drawn.network,
      stops: drawn.stops,
    }),
    minAlpha: options.svgMinAlpha,
    nodes: options.svgNodes,
    stroke: options.svgStroke,
    width: options.width,
  });
}

// The network stage the CLI renders headlessly and the Live tab renders on
// a canvas. A CLI frame passes its instances; Live runs the signals on its
// own clock (`settle` to the stills time, then `step`).
export function createNetworkStage({
  height,
  readFrame,
  renderer,
  samples = 4,
  transparent = false,
  width,
}) {
  // eslint-disable-next-line no-param-reassign
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(32, width / height, 0.1, 100),
  };
  const rig = createNetworkRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;
  let pulses = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = buildScenePostRuntimeConfig(
      NETWORK_TEST_POST,
      current.config
    ).slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? createPostChain({
              camera: cameras[projection],
              passOptions,
              renderer,
              scene,
              slots,
            })
          : null;
      let pipeline = chain?.pipeline;
      if (!pipeline) {
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = pass(scene, cameras[projection], passOptions);
      }
      pipelines[key] = { chain, pipeline };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(current.config, {}));
    return entry.pipeline;
  }

  function aim(view) {
    const camera = cameras[view.projection];
    if (view.projection === 'orthographic') {
      Object.assign(camera, {
        bottom: -view.halfHeight,
        left: -view.halfWidth,
        right: view.halfWidth,
        top: view.halfHeight,
      });
    } else {
      camera.fov = view.fov;
    }
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    rig.setDepthRange(view.depthNear, view.depthFar);
  }

  const advance = (seconds) => {
    const { config, network } = current;
    pulses.advance(network, network.positions, seconds, config.pulseSpeed);
  };

  const liveInstances = () =>
    buildInstances({
      config: current.config,
      network: current.network,
      pulses: pulses.pulses,
      stops: current.stops,
    });

  return {
    load(drawn) {
      current = drawn;
      pulses = createPulses(drawn.config.wireSeed, drawn.config.pulseCount);
      rig.apply(drawn.config);
      setBackdrop({ renderer, scene }, drawn.config.background, transparent);
    },

    settle(options) {
      advance(options.stillTime);
    },

    step(delta) {
      const { config, network } = current;
      pulses.step(network, network.positions, delta, config.pulseSpeed);
    },

    capture(view, instances = liveInstances()) {
      aim(view);
      rig.setInstances(instances);
      return readFrame(() => pipelineFor(view.projection).render());
    },

    svg(view, options) {
      return networkSvg(current, view, options);
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach(({ pipeline }) => pipeline.dispose?.());
    },
  };
}
