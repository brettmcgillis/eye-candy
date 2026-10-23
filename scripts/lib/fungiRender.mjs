/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/fungi/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/fungi-pipeline.md.
const ENTRIES = {
  fungi: '/src/modules/fungi/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/fungiRender/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const specimenAt = (kernel, args) => kernel.look.specimenAt(args);

// One renderer per output size, reused across frames: device and pipeline
// setup dominate a capture, and the rig's materials compile once.
export async function createFungiCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createFungiStage({
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

export const frameView = (kernel, args) => kernel.look.frameView(args);

export function sidecarFor({ config, options }) {
  return { preset: config, render: { ...options, base: undefined } };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createFungiCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
