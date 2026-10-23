/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/trucheterie3d/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { advanceFrame, createHeadlessRenderer } from './headlessWebgpu.mjs';
import { withResolvedDesign } from './trucheterieDesigns.mjs';

// Barrels only — see docs/trucheterie3d-pipeline.md.
const ENTRIES = {
  blob: '/src/modules/trucheterieBlob/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/trucheterie3dRender/index.js',
  tubes: '/src/modules/trucheterie3d/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function assertPalette(kernel, { options, typed }) {
  const names = kernel.look.PALETTE_NAMES;
  if (typed.has('blobPalette') && !names.includes(options.blobPalette)) {
    throw new Error(
      `unknown palette "${options.blobPalette}". ${names.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export const rollArgs = (kernel, { options, typed }) =>
  kernel.look.rollArgs({
    options,
    resolvePinned: (pinned) => withResolvedDesign(kernel.blob, pinned),
    typed,
  });

export const fieldAt = (kernel, args) => kernel.look.fieldAt(args);

export function sidecarFor({ config, membrane, name, options, tubes: built }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
    stats: membrane
      ? { ...built.stats, membrane: membrane.stats }
      : built.stats,
  };
}

// One renderer per output size, reused across fields and frames.
export async function createTubeCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createTubeStage({
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

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createTubeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );
