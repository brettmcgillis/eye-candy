/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/subdivisionRelief/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  sidecarFor,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/subdivision-relief-pipeline.md.
const ENTRIES = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/subdivisionReliefRender/index.js',
  relief: '/src/modules/subdivisionRelief/index.js',
  subdivision: '/src/modules/subdivision/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

export function assertPalette({ look }, { options, typed }) {
  const names = [look.PALETTE_NONE, ...look.PALETTE_NAMES];
  if (typed.has('palette') && !names.includes(options.palette)) {
    throw new Error(
      `unknown palette "${options.palette}". ${look.PALETTE_NAMES.length} names are available in src/utils/gradients.json, plus "${look.PALETTE_NONE}".`
    );
  }
}

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const pieceAt = (kernel, args) =>
  kernel.look.pieceAt({ ...args, loadImage });

export const plotSvg = (kernel, drawn, options) =>
  kernel.look.plotSvg(drawn, options);

export function sidecarOf({ config, name, piece }, options) {
  return {
    ...sidecarFor({ config, name, options }),
    stats: {
      leaves: piece.nodes.filter((node) => node.leaf).length,
      levels: piece.maxDepth + 1,
      nodes: piece.nodes.length,
      palette: piece.palette,
    },
  };
}

// One renderer per output size, reused across pieces and frames: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createReliefCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createReliefStage({
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
      createReliefCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
