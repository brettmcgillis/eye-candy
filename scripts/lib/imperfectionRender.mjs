/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/imperfection/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/imperfection-pipeline.md.
const ENTRIES = {
  imperfection: '/src/modules/imperfection/index.js',
  look: '/src/modules/imperfectionRender/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const paintingAt = (kernel, args) => kernel.look.paintingAt(args);

// One renderer per output size, reused across paintings and frames; each
// version's material compiles once.
export async function createPaintCapturer(kernel, { height, width }) {
  const { look } = kernel;
  const headless = await createHeadlessRenderer({ height, width });
  const stage = look.createPaintStage({
    loadImage,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
  });
  return {
    async capture(config, { time = 0, view = 'painting' } = {}) {
      await stage.load({ config });
      return stage.capture(look.paintingView(view), { time });
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
      createPaintCapturer(kernel, {
        height: options.height * options.pixelRatio,
        width: options.width * options.pixelRatio,
      }),
    work
  );

const sceneConfig = (config) =>
  Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]]));

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: sceneConfig(config),
    render: { ...options, base: undefined },
  };
}
