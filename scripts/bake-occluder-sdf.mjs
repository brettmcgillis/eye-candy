#!/usr/bin/env node

/**
 * bake-occluder-sdf.mjs
 *
 * Bake logo artwork into the signed-distance-field atlas CrossTalk's Radiance
 * Cascades preset marches its occluders against. Every analytic occluder shape
 * is an SDF in radialShadowTSL.js; artwork that has no sane analytic form
 * (logos) gets one baked here instead, from the source PNG's alpha.
 *
 * Each source becomes one square tile: the alpha silhouette is fitted to
 * ART_FRACTION of the tile (leaving room for the field to grow outside the
 * shape), an exact Euclidean distance transform runs inside and out, and the
 * signed distance — in tile widths, so it rescales with the occluder's size
 * control — is written to a single 8-bit channel over ±SDF_RANGE tiles. One
 * channel, not a packed multi-byte distance: the shader samples the atlas with
 * bilinear filtering, which would interpolate a low byte straight through its
 * 255→0 wrap and produce garbage at every coarse-step boundary.
 *
 * Usage:
 *   npm run occluder:sdf
 *
 * Output: public/textures/crossTalk/occluder-sdf.png (TILE × TILE per source,
 * laid out left to right in OCCLUDER_ATLAS_TILES order).
 */

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console, no-restricted-syntax */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Keep in sync with src/.../CrossTalk/utils/occluderAtlas.js — tile index is
// the shape id offset, so order is load-bearing.
const SOURCES = [
  { name: 'TurboFlex', file: 'public/icons/turbo_flex.png' },
  { name: 'Reversal', file: 'public/icons/reversal-inner.png' },
  { name: 'Bret', file: 'public/icons/bret.png' },
  { name: 'BretInner', file: 'public/icons/bret-inner.png' },
];

const TILE = 256;
const ART_FRACTION = 0.8;
// Encoded distance range, in tile widths, either side of the surface. Beyond
// it the field saturates — the shader falls back to the tile's box distance
// out there, so a shorter range just buys precision where it matters.
const SDF_RANGE = 0.25;
const OUT = 'public/textures/crossTalk/occluder-sdf.png';

const INF = 1e20;

// Felzenszwalb & Huttenlocher's exact squared-EDT, run per row then per column.
function edt1d(f, n) {
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;

  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }

  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
  return d;
}

function edt2d(mask, width, height) {
  const f = new Float64Array(Math.max(width, height));
  const grid = new Float64Array(width * height);

  for (let i = 0; i < grid.length; i += 1) grid[i] = mask[i] ? 0 : INF;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) f[x] = grid[y * width + x];
    const d = edt1d(f, width);
    for (let x = 0; x < width; x += 1) grid[y * width + x] = d[x];
  }

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) f[y] = grid[y * width + x];
    const d = edt1d(f, height);
    for (let y = 0; y < height; y += 1) grid[y * width + x] = d[y];
  }

  return grid;
}

async function bakeTile(file) {
  const art = Math.round(TILE * ART_FRACTION);
  const { data } = await sharp(path.join(ROOT, file))
    .ensureAlpha()
    .resize(art, art, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      fit: 'contain',
    })
    .extend({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      bottom: TILE - art - Math.floor((TILE - art) / 2),
      left: Math.floor((TILE - art) / 2),
      right: TILE - art - Math.floor((TILE - art) / 2),
      top: Math.floor((TILE - art) / 2),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const inside = new Uint8Array(TILE * TILE);
  const outside = new Uint8Array(TILE * TILE);
  let coverage = 0;
  for (let i = 0; i < inside.length; i += 1) {
    const solid = data[i * 4 + 3] > 127;
    inside[i] = solid ? 1 : 0;
    outside[i] = solid ? 0 : 1;
    coverage += solid ? 1 : 0;
  }

  const dOut = edt2d(inside, TILE, TILE);
  const dIn = edt2d(outside, TILE, TILE);

  // Signed distance in tile widths, remapped to 0..1 with 0.5 = the surface.
  const encoded = Buffer.alloc(TILE * TILE);
  for (let i = 0; i < inside.length; i += 1) {
    const d = (Math.sqrt(dOut[i]) - Math.sqrt(dIn[i])) / TILE;
    const t = d / (2 * SDF_RANGE) + 0.5;
    encoded[i] = Math.round(Math.min(Math.max(t, 0), 1) * 255);
  }

  return { coverage: coverage / inside.length, encoded };
}

async function main() {
  const tiles = [];
  for (const source of SOURCES) {
    // Sequential on purpose — each tile is a couple of hundred MB of
    // Float64 scratch, and there is no reason to hold two at once.
    const { coverage, encoded } = await bakeTile(source.file);
    console.log(
      `${source.name.padEnd(12)} ${source.file}  coverage ${(coverage * 100).toFixed(1)}%`
    );
    tiles.push(encoded);
  }

  const width = TILE * tiles.length;
  const atlas = Buffer.alloc(width * TILE);
  tiles.forEach((tile, index) => {
    for (let y = 0; y < TILE; y += 1) {
      tile.copy(atlas, y * width + index * TILE, y * TILE, (y + 1) * TILE);
    }
  });

  const png = await sharp(atlas, {
    raw: { channels: 1, height: TILE, width },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(ROOT, OUT), png);
  console.log(
    `\nwrote ${OUT} (${width}×${TILE}, ${tiles.length} tiles, ±${SDF_RANGE} tile range)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
