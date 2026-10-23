import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  buildSlice,
  configFrom,
  frameView,
  renderApollianSvg,
  resolveFamilies,
  rollApollianConfig,
  seedFor,
  stageLayout,
} from '@modules/apollian';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import APOLLIAN_POST from './post';
import createApollianRig from './rig';

export function rollArgs({ options, typed }) {
  const pinnable = new Set([
    ...SCENE_KEYS,
    ...Object.keys(RENDER_OPTIONS).filter(
      (key) => RENDER_OPTIONS[key].section === 'svg'
    ),
  ]);
  return {
    base: options.base ? configFrom(options.base) : {},
    families: resolveFamilies(options.families),
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 3),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => pinnable.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function objectAt({ batch, index, options, roll }) {
  const name = seedFor(batch, index);
  const rolled = rollApollianConfig(name, roll);
  // The roll also picks plot keys (svgStyle, svgPens) on top of the render
  // options; a facet it held leaves them undefined, so options stand.
  const config = { ...options };
  Object.entries(rolled).forEach(([key, value]) => {
    if (value !== undefined) config[key] = value;
  });
  return { config, name, stops: getPaletteStops(config.paletteName) };
}

// frameView's camera for a named view, or null for the slice view.
export function framingFor(config, options, view, azimuthOffset = 0) {
  if (view === 'slice') return null;
  return frameView({
    azimuthOffset,
    layout: stageLayout(config),
    options,
    view,
  });
}

export function plotSvg(config, stops, options) {
  const slice = buildSlice(config, {
    aspect: options.width / options.height,
    resolution: options.svgResolution,
  });
  return renderApollianSvg({
    config,
    height: options.height,
    slice,
    stops,
    stroke: options.svgStroke,
    width: options.width,
  });
}

// The object stage the CLI renders headlessly and the Live tab renders on a
// canvas. `capture(view)` draws the loaded object through frameView's camera,
// or the slice view when `view` is null.
export function createApollianStage({
  height,
  readFrame,
  renderer,
  transparent = false,
  width,
}) {
  // eslint-disable-next-line no-param-reassign
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const rig = createApollianRig();
  const pipelines = {};
  let current = null;
  scene.add(rig.mesh);
  rig.uniforms.transparent.value = transparent ? 1 : 0;
  renderer.setClearColor(0x000000, transparent ? 0 : 1);

  function pipelineFor(projection, config) {
    const slots = buildScenePostRuntimeConfig(
      APOLLIAN_POST,
      config
    ).slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? createPostChain({
              camera: cameras[projection],
              renderer,
              scene,
              slots,
            })
          : null;
      let pipeline = chain?.pipeline;
      if (!pipeline) {
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = pass(scene, cameras[projection]);
      }
      pipelines[key] = { chain, pipeline };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(config, {}));
    return entry.pipeline;
  }

  function aim(framing) {
    const camera = cameras[framing.projection];
    if (framing.projection === 'orthographic') {
      Object.assign(camera, {
        bottom: -framing.halfHeight,
        left: -framing.halfWidth,
        right: framing.halfWidth,
        top: framing.halfHeight,
      });
    } else {
      camera.fov = framing.fov;
      camera.aspect = width / height;
    }
    camera.near = framing.near;
    camera.far = framing.far;
    camera.up.set(...framing.up);
    camera.position.set(...framing.eye);
    camera.lookAt(...framing.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  return {
    // Returns the stage layout views are framed on.
    load(drawn) {
      current = drawn;
      return stageLayout(drawn.config);
    },

    capture(framing) {
      const { config, stops } = current;
      rig.apply(config, {
        height,
        stops,
        view: framing ? 'object' : 'slice',
        width,
      });
      if (framing) aim(framing);
      const pipeline = pipelineFor(
        framing?.projection ?? 'orthographic',
        config
      );
      return readFrame(() => pipeline.render());
    },

    // The plot is the field's slice, whatever the camera.
    svg(view, options) {
      return plotSvg(current.config, current.stops, options);
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach(({ pipeline }) => pipeline.dispose?.());
    },
  };
}
