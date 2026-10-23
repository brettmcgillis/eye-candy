import rasterizeSvg from '@dev/renderWorkbench/rasterizeSvg';

import createSvgStage, { svgView } from '@modules/renderStage/svgStage';
import * as blob from '@modules/trucheterieBlob';
import * as look from '@modules/trucheterieBlobRender';

const DESIGNS = '/dev-api/trucheterie-designer/designs';

async function resolveDesign(pinned) {
  if (!pinned.blobDesign || blob.isDesignCode(pinned.blobDesign)) return pinned;
  const response = await fetch(
    `${DESIGNS}/${encodeURIComponent(pinned.blobDesign)}`
  );
  const body = await response.json();
  const design = body.ok ? blob.designFromJson(body.design) : null;
  if (!design) throw new Error(`No usable design "${pinned.blobDesign}".`);
  const rotation = Number(body.design.rotation);
  return {
    ...pinned,
    blobDesign: blob.encodeDesign(design),
    ...(Number.isFinite(rotation) && pinned.planeRotation === undefined
      ? { planeRotation: rotation }
      : {}),
  };
}

function laneOptions(config) {
  return {
    exact: config.blobPaletteExact,
    fallback: config.bgColor,
    mode: config.blobLaneMode,
    monoColor: config.blobMonoColor,
    monochrome: config.blobMonochrome,
    palette: config.blobPalette,
    pathDiv: config.blobPathsPerUnit,
    seed: config.blobSeed,
    shuffleSeed: config.blobPaletteShuffle,
  };
}

function fieldSvg(field, config, options) {
  const lanes = look.resolveLaneColors(field.cells, laneOptions(config));
  const { penHalfWidth } = look.penGeometry(field.gridSize);
  return blob.renderBlobSvg(field, {
    background:
      options.svgFill && !options.transparent
        ? look.acesFilmicHex(config.sceneBgColor)
        : null,
    height: options.height,
    laneBreaks: (cell, slot, lane) => look.laneBreaks(lanes, cell, slot, lane),
    laneColor: options.svgFill
      ? (cell, slot, lane, progress) =>
          look.acesFilmic(look.laneColorAt(lanes, cell, slot, lane, progress))
      : null,
    margin: options.margin,
    pathDiv: config.blobPathsPerUnit,
    penWidth: penHalfWidth * 2 * field.cellSize * options.svgStroke,
    planeRotation: config.planeRotation,
    showStrokes: config.blobShowStrokes,
    strokeColor: look.acesFilmicHex(config.strokeColor),
    width: options.width,
  });
}

const trucheterieLive = {
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
  async generate({ options, pinned, seed }) {
    const typed = await resolveDesign(
      Object.fromEntries(
        [...pinned]
          .filter((key) => blob.SCENE_KEYS.includes(key))
          .map((key) => [blob.sceneNameFor(key), options[key]])
      )
    );
    const config = blob.rollBlobConfig(options.blobSeed ?? seed, {
      base: options.base ? blob.configFrom(options.base) : {},
      keep: String(options.keep ?? '')
        .split(',')
        .map((facet) => facet.trim())
        .filter(Boolean),
      paletteNames: look.PALETTE_NAMES,
      pinned: typed,
      seeds: {
        palette: options.paletteSeed ?? undefined,
        structure: options.structureSeed ?? undefined,
      },
    });
    return { config, name: config.blobSeed };
  },
  keep: (drawn) => blob.optionsFromConfig(drawn.config),
  async load({ drawn, options, stage }) {
    const field = blob.fieldFromConfig(drawn.config);
    const svg = fieldSvg(field, drawn.config, options);
    await stage.load({ svg });
    stage.setPlot(svg);
    return { drawn: { ...drawn, field }, layout: null };
  },
  name: (drawn) => drawn.name,
  module: 'trucheterieBlob',
};

export default trucheterieLive;
