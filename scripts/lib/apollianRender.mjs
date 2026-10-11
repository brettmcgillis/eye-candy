/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
  resolveFamilies,
} from '../../src/modules/apollian/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/apollian-pipeline.md.
const ENTRIES = {
  apollian: '/src/modules/apollian/index.js',
  look: '/src/modules/apollianRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { apollian, look } = kernel;
  const pinnable = new Set([
    ...SCENE_KEYS,
    ...Object.keys(RENDER_OPTIONS).filter(
      (key) => RENDER_OPTIONS[key].section === 'svg'
    ),
  ]);
  return {
    base: options.base ? apollian.configFrom(options.base) : {},
    families: resolveFamilies(options.families),
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => pinnable.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function objectAt(kernel, { batch, index, options, roll }) {
  const { apollian, look } = kernel;
  const name = apollian.seedFor(batch, index);
  const rolled = apollian.rollApollianConfig(name, roll);
  // The roll also picks plot keys (svgStyle, svgPens) on top of the render
  // options; a facet it held leaves them undefined, so options stand.
  const config = { ...options };
  Object.entries(rolled).forEach(([key, value]) => {
    if (value !== undefined) config[key] = value;
  });
  return { config, name, stops: look.getPaletteStops(config.paletteName) };
}

// One renderer per output size, reused across objects and frames: device and
// pipeline setup dominate a capture, and each family's material compiles once.
export async function createApollianCapturer(kernel, { height, width }) {
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
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const rig = look.createApollianRig();
  const pipelines = {};
  scene.add(rig.mesh);

  function pipelineFor(projection, config) {
    const slots = post
      .buildScenePostRuntimeConfig(look.APOLLIAN_POST, config)
      .slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? post.createPostChain({
              camera: cameras[projection],
              renderer,
              scene,
              slots,
            })
          : null;
      let pipeline = chain?.pipeline;
      if (!pipeline) {
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = TSL.pass(scene, cameras[projection]);
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
    return camera;
  }

  return {
    // `framing` is frameView's camera, or null for the slice view.
    async capture(config, stops, framing) {
      const view = framing ? 'object' : 'slice';
      rig.apply(config, { height, stops, view, width });
      const projection = framing?.projection ?? 'orthographic';
      if (framing) aim(framing);
      const pipeline = pipelineFor(projection, config);
      return headless.readFrame(() => pipeline.render());
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
      createApollianCapturer(kernel, {
        height: options.height * options.pixelRatio,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export function framingFor(kernel, config, options, view, azimuthOffset = 0) {
  if (view === 'slice') return null;
  const { apollian } = kernel;
  return apollian.frameView({
    azimuthOffset,
    layout: apollian.stageLayout(config),
    options,
    view,
  });
}

export function plotSvg(kernel, config, stops, options) {
  const { apollian } = kernel;
  const slice = apollian.buildSlice(config, {
    aspect: options.width / options.height,
    resolution: options.svgResolution,
  });
  return apollian.renderApollianSvg({
    config,
    height: options.height,
    slice,
    stops,
    stroke: options.svgStroke,
    width: options.width,
  });
}

const sceneConfig = (config) =>
  Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]]));

export function sidecarFor({ config, name, options }) {
  return {
    name,
    plot: Object.fromEntries(
      Object.keys(RENDER_OPTIONS)
        .filter((key) => RENDER_OPTIONS[key].section === 'svg')
        .map((key) => [key, config[key]])
    ),
    preset: sceneConfig(config),
    render: { ...options, base: undefined, palettes: undefined },
  };
}
