/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/cables/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/cables-pipeline.md.
const ENTRIES = {
  cables: '/src/modules/cables/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/cablesRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const generationAt = (kernel, args) => kernel.look.generationAt(args);

// One renderer per output size, reused across generations and frames.
export async function createCablesCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createCablesStage({
    ...options,
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
      createCablesCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
