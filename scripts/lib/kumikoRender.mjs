/* eslint-disable import/no-extraneous-dependencies */
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/kumiko/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { REPO_ROOT } from './loadModules.mjs';

// Barrels only — see docs/kumiko-pipeline.md.
const ENTRIES = {
  kumiko: '/src/modules/kumiko/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/kumikoRender/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

const IMAGE_MAX = 1024;
const decoded = new Map();

// A source image as the RGBA bytes the kernel samples: a path under public/
// (images/…) as the scene would load it, or any file path.
export async function loadSourceImage(source) {
  if (!source) return null;
  if (!decoded.has(source)) {
    const inPublic = path.join(REPO_ROOT, 'public', source.replace(/^\//u, ''));
    const file = existsSync(inPublic) ? inPublic : path.resolve(source);
    const { data, info } = await sharp(file)
      .rotate()
      .resize(IMAGE_MAX, IMAGE_MAX, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    decoded.set(source, {
      channels: 4,
      data,
      height: info.height,
      width: info.width,
    });
  }
  return decoded.get(source);
}

// What a batch draws at `index` (kumikoRender's panelAt, with sharp decoding
// its source image).
export const panelAt = (kernel, args) =>
  kernel.look.panelAt({ ...args, loadImage: loadSourceImage });

export const renderFlatSvg = (kernel, drawn, style) =>
  kernel.look.panelSvg(drawn, style);

// Headless 3D stills: kumikoRender's stage on the headless renderer.
export async function createKumikoCapturer(kernel, options) {
  const headless = await createHeadlessRenderer({
    height: options.height,
    width: options.width,
  });
  const stage = kernel.look.createKumikoStage({
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
      createKumikoCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        transparent: options.transparent,
        width: options.width * options.pixelRatio,
      }),
    work
  );

export function sidecarFor({ config, options, panel }) {
  return {
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
    stats: {
      leaves: panel.leaves.length,
      openings: panel.openings.length,
      pieces: panel.pieces.length,
      pool: panel.pool,
    },
  };
}
