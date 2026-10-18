/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  configFrom,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/isoMeter/renderOptions.mjs';
import { createParseCli, keepList, pinnedFrom } from './generatorCli.mjs';
import loadModules from './loadModules.mjs';

const ENTRIES = {
  isoMeter: '/src/modules/isoMeter/index.js',
  palettes: '/src/utils/gradientPalette.js',
};

export const WINTERKAMMER_MAX_FRAMES = 600;

export async function loadKernel() {
  const loaded = await loadModules(Object.values(ENTRIES));
  const palettes = loaded[ENTRIES.palettes];
  return {
    getPaletteStops: palettes.getPaletteStops,
    isoMeter: loaded[ENTRIES.isoMeter],
    paletteNames: palettes.PALETTE_NAMES,
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

export function rollArgs(kernel, { options, typed }) {
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: keepList(options),
    palettes:
      options.palettes ??
      kernel.paletteNames.filter(
        (name) => (kernel.getPaletteStops(name)?.length ?? 0) >= 2
      ),
    pinned: pinnedFrom({ options, typed }, SCENE_KEYS),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function pieceAt(kernel, { batch, index, roll }) {
  const name = kernel.isoMeter.seedFor(batch, index);
  const config = kernel.isoMeter.rollConfig(name, roll);
  const stops =
    config.palette === 'None' ? null : kernel.getPaletteStops(config.palette);
  return { config, name, stops };
}

export const canvasOf = (options) => ({
  height: options.height,
  width: options.width,
});

export const rasterSize = (options) => ({
  height: Math.round(options.height * options.pixelRatio),
  width: Math.round(options.width * options.pixelRatio),
});

export function createPiece(kernel, { config, stops }, options) {
  return kernel.isoMeter.pieceFromConfig(config, {
    aspect: options.width / options.height,
    stops,
  });
}

const inkOf = (kernel, piece, config) =>
  config.paletteInk ? kernel.isoMeter.toHex(piece.ink) : config.inkColor;

export function blockSvg(kernel, piece, build, config, options, style) {
  return kernel.isoMeter.renderSvg(piece, build, {
    background: !options.transparentBackground,
    canvas: canvasOf(options),
    fill: config.fill,
    ink: inkOf(kernel, piece, config),
    lineWidth: config.lineWidth,
    outlineMode: kernel.isoMeter.OUTLINE_MODE_IDS[config.outlineMode],
    outlineWidth: config.outlineMode === 'none' ? 0 : config.outlineWidth,
    style,
  });
}

export function winterkammerPainter(kernel, piece, options) {
  return kernel.isoMeter.createSvgPainter({
    ...canvasOf(options),
    mirroredX: piece.mirroredX,
    mirroredY: piece.mirroredY,
    refSize: piece.refSize,
  });
}

// The finished piece as SVG: a block built to the end, or Winterkammer's
// never-cleared canvas once every visible window has drawn.
export function pieceSvg(kernel, piece, config, options) {
  if (piece.name === 'winterkammer') {
    const painter = winterkammerPainter(kernel, piece, options);
    const run = kernel.isoMeter.createWinterkammerRun(piece, {
      settleFrames: 1,
    });
    while (!run.settled && run.frame < WINTERKAMMER_MAX_FRAMES) {
      run.step(painter);
    }
    return painter.toString();
  }
  const build = kernel.isoMeter.buildPiece(piece);
  return blockSvg(kernel, piece, build, config, options, 'final');
}

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
