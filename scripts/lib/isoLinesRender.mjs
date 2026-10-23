/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/isoLines/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/iso-lines-pipeline.md.
const ENTRIES = {
  iso: '/src/modules/isoLines/index.js',
  look: '/src/modules/isoLinesRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const pieceAt = (kernel, args) =>
  kernel.look.pieceAt({ ...args, loadImage });

// One renderer per output size, reused across pieces and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createIsoCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createIsoStage({
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
      createIsoCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
