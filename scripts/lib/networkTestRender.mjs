/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/networkTest/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/network-test-pipeline.md.
const ENTRIES = {
  look: '/src/modules/networkTestRender/index.js',
  net: '/src/modules/networkTest/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const networkAt = (kernel, args) =>
  kernel.look.networkAt({ ...args, loadImage });

export const padFor = (kernel, drawn, args) => kernel.look.padFor(drawn, args);

// One renderer per output size, reused across networks and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createNetworkCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createNetworkStage({
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
      createNetworkCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export const settledInstances = (kernel, drawn, seconds) =>
  kernel.look.settledInstances(drawn, seconds);
