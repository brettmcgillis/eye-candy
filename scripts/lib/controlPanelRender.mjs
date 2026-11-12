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

// Barrels only — see docs/control-panel-pipeline.md — plus the scene's
// presets, which `--preset` starts a roll from.
const ENTRIES = {
  look: '/src/modules/controlPanelRender/index.js',
  panel: '/src/modules/controlPanel/index.js',
  presets: '/src/components/scenes/WebGPU/ControlPanel/presets/presets.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

// A named scene preset is the panel as the scene shows it: every facet is
// held unless --keep lists some, and --base is laid over it. The workbench
// sends every option, defaults included, so a pin that only repeats its
// default gives way to the preset's own value.
function withPreset(kernel, roll, { options }) {
  if (options.preset == null) return roll;
  const preset = kernel.presets.PRESETS[options.preset];
  if (!preset) {
    throw new Error(
      `Unknown preset "${options.preset}". Presets: ${Object.keys(kernel.presets.PRESETS).join(', ')}.`
    );
  }
  const config = kernel.panel.configFrom(preset);
  const defaults = kernel.panel.sceneDefaults();
  return {
    ...roll,
    base: { ...config, ...roll.base },
    keep: roll.keep.length > 0 ? roll.keep : kernel.panel.facets(),
    pinned: Object.fromEntries(
      Object.entries(roll.pinned).filter(
        ([key, value]) => !(key in config) || value !== defaults[key]
      )
    ),
  };
}

export const rollArgs = (kernel, args) =>
  withResolvedDesign(
    kernel.panel,
    withPreset(kernel, kernel.look.rollArgs(args), args)
  );

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
