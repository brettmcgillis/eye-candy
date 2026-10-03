/* eslint-disable import/no-extraneous-dependencies */
import { access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import { REPO_ROOT } from './loadModules.mjs';

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

// A scene path (images/…, served from public/) or a plain file path.
export async function resolveImagePath(source) {
  const candidates = [
    path.join(REPO_ROOT, 'public', source.replace(/^\/+/u, '')),
    path.resolve(process.cwd(), source),
    path.resolve(REPO_ROOT, source),
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const file of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await exists(file)) return file;
  }
  throw new Error(`source image not found: ${source}`);
}

const imageCache = new Map();

// RGBA bytes fitted inside `maxSize`, never enlarged — the same decode the
// scenes do on a canvas.
export async function loadImage(source, maxSize) {
  if (!source) return null;
  const key = `${source}|${maxSize}`;
  if (!imageCache.has(key)) {
    const file = await resolveImagePath(source);
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .resize({
        fit: 'inside',
        height: maxSize,
        width: maxSize,
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    imageCache.set(key, {
      channels: info.channels,
      data,
      height: info.height,
      width: info.width,
    });
  }
  return imageCache.get(key);
}
