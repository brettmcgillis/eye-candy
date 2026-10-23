/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/brutalist/renderOptions.mjs';
import { createParseCli, withRenderer } from './generatorCli.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';

// Barrels only — see docs/brutalist-pipeline.md.
const ENTRIES = {
  kernel: '/src/modules/brutalist/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/brutalistRender/index.js',
  post: '/src/modules/postRig/index.js',
};

// ez-tree loads its bark and leaf textures from data URIs at import time;
// the rig replaces its materials, so a do-nothing image is enough to let it
// evaluate. The stub exists only for the import.
async function loadTree() {
  const image = () => ({
    addEventListener() {},
    removeEventListener() {},
    style: {},
  });
  globalThis.document = { createElement: image, createElementNS: image };
  try {
    const { Tree } = await import('@dgreenheck/ez-tree');
    return Tree;
  } finally {
    delete globalThis.document;
  }
}

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const Tree = await loadTree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    Tree,
    brutalist: pick('kernel'),
    lights: pick('lights'),
    look: pick('look'),
    post: pick('post'),
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const structureAt = (kernel, args) => kernel.look.structureAt(args);

// One renderer per output size and stage, reused across structures and
// frames: device and pipeline setup dominate a capture.
export async function createCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createBrutalistStage({
    ...options,
    Tree: kernel.Tree,
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
      createCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        stage: options.stage,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
  };
}
