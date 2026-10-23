/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/isoMeter/renderOptions.mjs';
import { createParseCli, loadKernelModules } from './generatorCli.mjs';

// Barrels only — see docs/iso-meter-pipeline.md.
const ENTRIES = {
  isoMeter: '/src/modules/isoMeter/index.js',
  look: '/src/modules/isoMeterRender/index.js',
  palettes: '/src/utils/gradientPalette.js',
};

export const WINTERKAMMER_MAX_FRAMES = 600;

export async function loadKernel() {
  const loaded = await loadKernelModules(ENTRIES);
  return {
    ...loaded,
    getPaletteStops: loaded.palettes.getPaletteStops,
    paletteNames: loaded.palettes.PALETTE_NAMES,
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
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

export const rollArgs = (kernel, args) => kernel.look.rollArgs(args);

export const pieceAt = (kernel, args) => kernel.look.pieceAt(args);

export const canvasOf = (options) => ({
  height: options.height,
  width: options.width,
});

export const rasterSize = (options) => ({
  height: Math.round(options.height * options.pixelRatio),
  width: Math.round(options.width * options.pixelRatio),
});

export const createPiece = (kernel, drawn, options) =>
  kernel.look.createPiece(drawn, options);

export const blockSvg = (kernel, ...args) => kernel.look.blockSvg(...args);

export const winterkammerPainter = (kernel, ...args) =>
  kernel.look.winterkammerPainter(...args);

export const pieceSvg = (kernel, ...args) => kernel.look.pieceSvg(...args);

export async function rasterize(svg, options) {
  const { data, info } = await sharp(Buffer.from(svg), {
    density: 72 * options.pixelRatio,
    limitInputPixels: false,
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
}

export function statsOf(piece) {
  if (piece.name === 'winterkammer') {
    return {
      layout: piece.layout.kinds.length,
      palettes: piece.palettes.length,
      piece: piece.name,
    };
  }
  return { piece: piece.name, settings: piece.settings };
}
