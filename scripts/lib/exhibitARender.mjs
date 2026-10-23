/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/exhibitA/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { advanceFrame, createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/exhibit-a-pipeline.md.
const ENTRIES = {
  exhibit: '/src/modules/exhibitA/index.js',
  look: '/src/modules/exhibitARender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const exhibitAt = (kernel, args) => kernel.look.exhibitAt(args);

// One renderer per output size, reused across exhibits and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile
// once.
export async function createExhibitCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createExhibitStage({
    ...options,
    advance: advanceFrame,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
  });
  return {
    ...stage,
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
      createExhibitCapturer(kernel, {
        height: options.height * options.pixelRatio,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

// A camera that fits the loaded exhibit and plinth from a named bearing.
export function viewFor(kernel, { azimuthOffset = 0, layout, options, view }) {
  return kernel.exhibit.frameView({ azimuthOffset, layout, options, view });
}

const sceneConfig = (config) =>
  Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]]));

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: sceneConfig(config),
    render: { ...options, base: undefined, palettes: undefined },
  };
}
