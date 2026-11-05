/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/controlPanel/renderOptions.mjs';
import { withResolvedDesign } from './controlPanelDesigns.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/control-panel-pipeline.md.
const ENTRIES = {
  look: '/src/modules/controlPanelRender/index.js',
  panel: '/src/modules/controlPanel/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) =>
  withResolvedDesign(kernel.panel, kernel.look.rollArgs(args));

export const panelAt = (kernel, args) => kernel.look.panelAt(args);

// One renderer per output size, reused across panels and frames: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createPanelCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createPanelStage({
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
      createPanelCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
