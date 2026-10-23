/* eslint-disable import/no-extraneous-dependencies */
import path from 'node:path';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/nestingBoxes/renderOptions.mjs';
import { createParseCli, loadKernelModules } from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

// Barrels only — see docs/nesting-boxes-pipeline.md.
const ENTRIES = {
  boxes: '/src/modules/nestingBoxes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/nestingBoxesRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const treeAt = (kernel, args) => kernel.look.treeAt(args);

// A surface map as top-down RGBA; the stage flips it as useTexture would.
async function loadSurfaceImage(url) {
  const file = path.join(REPO_ROOT, 'public', url.replace(/^\//u, ''));
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
}

// One renderer per output size, reused across trees and frames: device and
// pipeline setup dominate a capture, and the box material compiles once.
export async function createTreeCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createTreeStage({
    ...options,
    loadImage: loadSurfaceImage,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
  });
  return {
    ...stage,
    async dispose() {
      await stage.dispose();
      headless.dispose();
    },
  };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createTreeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      })
  );
  try {
    return await work(capturer);
  } finally {
    await capturer.dispose();
  }
}
