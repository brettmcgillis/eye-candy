/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/apollonian/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/apollonian-pipeline.md.
const ENTRIES = {
  apollonian: '/src/modules/apollonian/index.js',
  look: '/src/modules/apollonianRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const objectAt = (kernel, args) => kernel.look.objectAt(args);

// One renderer per output size, reused across objects and frames: device and
// pipeline setup dominate a capture, and each family's material compiles once.
export async function createApollonianCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createApollonianStage({
    ...options,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
  });
  return {
    // `framing` is frameView's camera, or null for the slice view.
    capture(config, stops, framing) {
      stage.load({ config, stops });
      return stage.capture(framing);
    },

    dispose() {
      stage.dispose();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createApollonianCapturer(kernel, {
        height: options.height * options.pixelRatio,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export const framingFor = (kernel, ...args) => kernel.look.framingFor(...args);

export const plotSvg = (kernel, ...args) => kernel.look.plotSvg(...args);

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
