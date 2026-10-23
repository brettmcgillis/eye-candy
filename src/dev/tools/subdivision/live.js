import loadImageData from '@dev/renderWorkbench/loadImageData';
import rasterizeSvg from '@dev/renderWorkbench/rasterizeSvg';

import createSvgStage, { svgView } from '@modules/renderStage/svgStage';
import * as subdivision from '@modules/subdivision';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

async function pieceAt({ loadImage = loadImageData, options, pinned, seed }) {
  const roll = {
    base: options.base ? subdivision.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: PALETTE_NAMES,
    pinned: Object.fromEntries(
      [...pinned]
        .filter((key) => subdivision.SCENE_KEYS.includes(key))
        .map((key) => [subdivision.sceneNameFor(key), options[key]])
    ),
    seeds: {
      field: options.fieldSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
      structure: options.structureSeed ?? undefined,
    },
  };
  const batch = options.batch ?? seed;
  const config = subdivision.rollConfig(batch, roll);
  const image =
    config.field === 'image'
      ? await loadImage(config.sourceImage, subdivision.SOURCE_IMAGE_MAX)
      : null;
  const stops =
    config.palette === subdivision.PALETTE_NONE
      ? null
      : getPaletteStops(config.palette);
  return {
    config,
    name: batch,
    piece: subdivision.buildPiece(config, {
      canvas: { height: options.height, width: options.width },
      image,
      stops,
    }),
  };
}

const subdivisionLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, rasterize = rasterizeSvg, readFrame, renderer }) => {
    const stage = createSvgStage({
      height: Math.round(options.height * options.pixelRatio),
      rasterize,
      readFrame,
      renderer,
      width: Math.round(options.width * options.pixelRatio),
    });
    let plot = null;
    return Object.assign(stage, {
      setPlot(svg) {
        plot = svg;
      },
      svg: () => plot,
    });
  },
  flat: true,
  frame: ({ options }) => svgView(options.width / options.height),
  generate: pieceAt,
  keep: (drawn) => subdivision.optionsFromConfig(drawn.config),
  async load({ drawn, options, stage }) {
    const fill = subdivision.renderFillSvg(drawn.piece, drawn.config, {
      background: !options.transparent,
      size: {
        height: Math.round(options.height * options.pixelRatio),
        width: Math.round(options.width * options.pixelRatio),
      },
    });
    await stage.load({ svg: fill });
    stage.setPlot(
      subdivision.renderPlotSvg(
        drawn.piece,
        { ...drawn.config, ...subdivision.plotOptionsFrom(options) },
        { widthMm: options.plotWidthMm }
      )
    );
    return { drawn, layout: null };
  },
  name: (drawn) => drawn.name,
};

export default subdivisionLive;
