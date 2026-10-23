/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/rugPull/renderOptions.mjs';
import { createParseCli, withRenderer } from './generatorCli.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';

// Barrels only — see docs/rug-pull-pipeline.md.
const ENTRIES = {
  look: '/src/modules/rugPullRender/index.js',
  rug: '/src/modules/rugPull/index.js',
};

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  return {
    THREE,
    TSL,
    look: loaded[ENTRIES.look],
    rug: loaded[ENTRIES.rug],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const rugAt = (kernel, args) => kernel.look.rugAt(args);

export const viewsOf = (options) =>
  String(options.views)
    .split(',')
    .map((view) => view.trim())
    .filter(Boolean);

export function cartoonFrame(kernel, build, options) {
  const { rug } = kernel;
  return rug.rasterCartoon(build, {
    grid: options.cartoonGrid,
    scale: options.cartoonScale,
    warp: rug.hexToRgb(build.colors[build.colors.length - 1]),
  });
}

export const drape = (kernel, woven, mode, steps) =>
  kernel.look.drape(woven, mode, steps);

// One renderer per output size, reused across rugs and views: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createRugCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createRugStage({
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
      createRugCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export function sidecarFor({ build, config, name, options }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
    weave: {
      bands: build.bands,
      cols: build.cols,
      house: build.mine,
      rows: build.rows,
    },
  };
}
