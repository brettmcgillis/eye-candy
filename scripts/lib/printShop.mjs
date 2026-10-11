/* eslint-disable import/no-extraneous-dependencies */
import Module from 'manifold-3d';
import path from 'node:path';
import sharp from 'sharp';

import loadModules, { REPO_ROOT } from './loadModules.mjs';

const REGISTRY = '/src/dev/tools/printShop/printables/index.js';
const KERNEL = '/src/dev/tools/printShop/kernel/index.js';

// The page's worker and this CLI run literally the same printables and
// kernel, loaded through Vite so aliases and import.meta.glob resolve.
export async function loadPrintShop() {
  const loaded = await loadModules([REGISTRY, KERNEL]);
  return { ...loaded[KERNEL], ...loaded[REGISTRY] };
}

// Scene asset URLs (`/textures/x.png`) are served from public/; headlessly
// they are read from there and decoded to RGBA.
export async function loadImage(url) {
  const file = path.join(
    REPO_ROOT,
    'public',
    decodeURI(url).replace(/^\/+/u, '')
  );
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
}

let manifold = null;

// What a printable's build and the kernel's booleans need headlessly.
export async function printEnv() {
  if (!manifold) {
    manifold = await Module();
    manifold.setup();
  }
  return { loadImage, manifold };
}

export const encodePng = ({ data, height, width }) =>
  sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { channels: 4, height, width },
  })
    .png()
    .toBuffer();

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

export const printName = (printable, options) =>
  [
    printable.id,
    options.variant && slugify(options.variant),
    `${options.size}mm`,
  ]
    .filter(Boolean)
    .join('-');
