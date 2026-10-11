/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/networkTest/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/network-test-pipeline.md.
const ENTRIES = {
  look: '/src/modules/networkTestRender/index.js',
  net: '/src/modules/networkTest/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { look, net } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? net.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
// A source image without a typed imageShare is drawn alone.
export async function networkAt(kernel, { batch, index, roll }) {
  const { look, net } = kernel;
  const name = net.seedFor(batch, index);
  const config = net.rollNetworkTestConfig(name, roll);
  if (config.sourceImage && roll.pinned.imageShare == null) {
    config.imageShare = 1;
  }
  const image =
    config.sourceImage && config.imageShare > 0
      ? await loadImage(config.sourceImage, net.SOURCE_IMAGE_MAX)
      : null;
  return {
    config,
    name,
    network: net.buildNetwork(config, { image }),
    stops: look.getPaletteStops(config.paletteName),
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

// One renderer per output size, reused across networks and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createNetworkCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, look, post } = kernel;

  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.toneMapping = THREE.NoToneMapping;
    },
    height,
    width,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(32, width / height, 0.1, 100),
  };
  const rig = look.createNetworkRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = post
      .buildScenePostRuntimeConfig(look.NETWORK_TEST_POST, current.config)
      .slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? post.createPostChain({
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
        pipeline.outputNode = TSL.pass(scene, cameras[projection], passOptions);
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

  async function render(pipeline) {
    return headless.readFrame(() => pipeline.render());
  }

  return {
    load(drawn) {
      current = drawn;
      rig.apply(drawn.config);
      scene.background = new THREE.Color(drawn.config.background);
    },

    async capture(view, instances) {
      aim(view);
      rig.setInstances(instances);
      return render(pipelineFor(view.projection));
    },

    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createNetworkCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        width: options.width * options.pixelRatio,
      }),
    work
  );

// A settled network with its signals advanced to `seconds`.
export function settledInstances(kernel, drawn, seconds) {
  const { net } = kernel;
  const { config, network, stops } = drawn;
  const pulses = net.createPulses(config.wireSeed, config.pulseCount);
  pulses.advance(network, network.positions, seconds, config.pulseSpeed);
  return net.buildInstances({
    config,
    network,
    pulses: pulses.pulses,
    stops,
  });
}
