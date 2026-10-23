/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/fractalAutomata/renderOptions.mjs';
import { createParseCli, loadKernelModules } from './generatorCli.mjs';
import { advanceFrame, createHeadlessRenderer } from './headlessWebgpu.mjs';
import { runStage } from './progress.mjs';

// Barrels only — see docs/fractal-automata-pipeline.md.
const ENTRIES = {
  auto: '/src/modules/fractalAutomata/index.js',
  look: '/src/modules/fractalAutomataRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

// One renderer per output size, reused across structures and frames: device
// and pipeline setup dominate a capture, and the voxel materials compile once
// per structure.
export async function createAutomataCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createAutomataStage({
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

export const settleStructure = (capturer, kernel, args) =>
  kernel.look.settleStructure(capturer, args);

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createAutomataCapturer(kernel, {
        height: options.height * options.pixelRatio,
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

export function sidecarFor({ config, name, options, stats }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
    stats,
  };
}
