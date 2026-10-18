/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SOURCE_IMAGE_MAX,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/subdivision/renderOptions.mjs';
import { createParseCli } from './generatorCli.mjs';
import loadModules from './loadModules.mjs';
import {
  loadImage as loadSourceImage,
  resolveImagePath,
} from './sourceImage.mjs';

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

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

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
        .map((key) => [kernel.subdivision.sceneNameFor(key), options[key]])
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
  const baseSeed = options.batch ?? subdivision.randomSeed();
  const seed =
    options.batch == null ? baseSeed : subdivision.seedFor(baseSeed, index);
  return { config: subdivision.rollConfig(seed, roll), seed };
}

export { resolveImagePath };

export const loadImage = (source) => loadSourceImage(source, SOURCE_IMAGE_MAX);

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

// PNG/WebP are the fill SVG rasterised, so they cannot disagree with it. The
// still driver encodes the frame (and stamps the overlay on it).
export async function fillFrame(kernel, piece, config, options) {
  const { data, info } = await fillImage(kernel, piece, config, options)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
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
