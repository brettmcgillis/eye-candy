/* eslint-disable import/no-extraneous-dependencies */
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SOURCE_IMAGE_MAX,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/subdivision/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';

export { REPO_ROOT };

const ENTRIES = {
  palettes: '/src/utils/gradientPalette.js',
  subdivision: '/src/modules/subdivision/index.js',
};

export async function loadKernel() {
  const loaded = await loadModules(Object.values(ENTRIES));
  const palettes = loaded[ENTRIES.palettes];
  return {
    getPaletteStops: palettes.getPaletteStops,
    paletteNames: palettes.PALETTE_NAMES,
    subdivision: loaded[ENTRIES.subdivision],
  };
}

async function readJsonOption(value) {
  if (value == null || typeof value !== 'string') return value;
  if (/^\s*[[{]/u.test(value)) return JSON.parse(value);
  return JSON.parse(await readFile(value, 'utf8'));
}

export async function parseCli(kind, argv) {
  const args = parseArgs(argv, defaultsFor(kind));
  if (args.help) return { help: true };
  const raw = { ...args };
  await Promise.all(
    Object.entries(RENDER_OPTIONS)
      .filter(([, spec]) => spec.type === 'json')
      .map(async ([key]) => {
        raw[key] = await readJsonOption(args[key]);
      })
  );
  return { options: normalizeOptions(kind, raw), typed: providedKeys(args) };
}

export function assertPalette(kernel, { options, typed }) {
  const names = ['None', ...kernel.paletteNames];
  if (typed.has('palette') && !names.includes(options.palette)) {
    throw new Error(
      `unknown palette "${options.palette}". ${kernel.paletteNames.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(kernel.subdivision.SCENE_KEYS);
  return {
    base: options.base ? kernel.subdivision.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: kernel.paletteNames,
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    seeds: {
      field: options.fieldSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
      structure: options.structureSeed ?? undefined,
    },
  };
}

export function pieceAt(kernel, { index, options, roll }) {
  const { subdivision } = kernel;
  const baseSeed = options.seed ?? subdivision.randomSeed();
  const seed =
    options.seed == null ? baseSeed : subdivision.seedFor(baseSeed, index);
  return { config: subdivision.rollConfig(seed, roll), seed };
}

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

export async function loadImage(source) {
  if (!source) return null;
  if (!imageCache.has(source)) {
    const file = await resolveImagePath(source);
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .resize({
        fit: 'inside',
        height: SOURCE_IMAGE_MAX,
        width: SOURCE_IMAGE_MAX,
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    imageCache.set(source, {
      channels: info.channels,
      data,
      height: info.height,
      width: info.width,
    });
  }
  return imageCache.get(source);
}

export const canvasFor = (options) => ({
  height: options.height,
  width: options.width,
});

export async function buildPieceFor(kernel, config, options) {
  const image =
    config.field === 'image' ? await loadImage(config.sourceImage) : null;
  const stops =
    config.palette === 'None' ? null : kernel.getPaletteStops(config.palette);
  return kernel.subdivision.buildPiece(config, {
    canvas: canvasFor(options),
    image,
    stops,
  });
}

export const rasterSize = (options) => ({
  height: Math.round(options.height * options.pixelRatio),
  width: Math.round(options.width * options.pixelRatio),
});

function fillImage(kernel, piece, config, options, grow) {
  const svg = kernel.subdivision.renderFillSvg(piece, config, {
    background: !options.transparentBackground,
    grow,
    size: rasterSize(options),
  });
  return sharp(Buffer.from(svg), { limitInputPixels: false });
}

// PNG/WebP are the fill SVG rasterised, so they cannot disagree with it.
export async function rasterise(kernel, piece, config, options, format) {
  const image = fillImage(kernel, piece, config, options);
  return format === 'webp'
    ? image.webp({ lossless: true }).toBuffer()
    : image.png().toBuffer();
}

// One video frame as raw RGBA, the piece at growth level `grow`.
export function rawFrame(kernel, piece, config, options, grow) {
  return fillImage(kernel, piece, config, options, grow)
    .ensureAlpha()
    .raw()
    .toBuffer();
}

export function plotSvg(kernel, piece, config, options) {
  const plot = { ...config, ...kernel.subdivision.plotOptionsFrom(options) };
  return kernel.subdivision.renderPlotSvg(piece, plot, {
    widthMm: options.svgWidthMm,
  });
}

export function sidecarFor({ config, options, piece }) {
  const leaves = piece.nodes.filter((node) => node.leaf).length;
  return {
    preset: config,
    render: { ...options, base: undefined },
    stats: { leaves, nodes: piece.nodes.length, palette: piece.palette },
  };
}
