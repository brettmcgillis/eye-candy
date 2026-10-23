import rasterizeSvg from '@dev/renderWorkbench/rasterizeSvg';

import { optionsFromConfig, resolveViews } from '@modules/isoMeter';
import {
  createPiece,
  createVoxelStage,
  pieceAt,
  pieceSvg,
  rollArgs,
} from '@modules/isoMeterRender';
import createSvgStage, { svgView } from '@modules/renderStage/svgStage';

const voxel = (options) => options.display === 'voxel';

// Live shows what the form's display renders: the voxel view (orbit), or
// the flat drawing (pan and zoom). Either way the plot is the piece's SVG.
const isoMeterLive = {
  checks: [{ display: 'voxel' }],
  configOf: (drawn) => drawn.config,
  createStage({ options, rasterize = rasterizeSvg, readFrame, renderer }) {
    if (!voxel(options)) {
      return createSvgStage({
        height: Math.round(options.height * options.pixelRatio),
        rasterize,
        readFrame,
        renderer,
        width: Math.round(options.width * options.pixelRatio),
      });
    }
    const stage = createVoxelStage({
      height: options.height,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
      width: options.width,
    });
    let plot = null;
    return Object.assign(stage, {
      setPlot(svg) {
        plot = svg;
      },
      svg: () => plot,
    });
  },
  flat: (options) => !voxel(options),
  frame: ({ layout }) => layout.frame,
  generate: ({ options, pinned, seed }) =>
    pieceAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  async load({ drawn, options, stage }) {
    const piece = createPiece(drawn, options);
    const svg = pieceSvg(piece, drawn.config, options);
    if (!voxel(options)) {
      await stage.load({ svg });
      return {
        drawn,
        layout: { frame: svgView(options.width / options.height) },
      };
    }
    stage.load(piece, drawn.config);
    stage.setPlot(svg);
    const view = resolveViews(options.views)[0] ?? 'iso';
    return { drawn, layout: { frame: stage.frameOf({ view }) } };
  },
  name: (drawn) => drawn.name,
  stageKey: (options) =>
    JSON.stringify([
      options.width,
      options.height,
      options.pixelRatio,
      options.display,
      options.samples,
      options.transparent,
    ]),
};

export default isoMeterLive;
