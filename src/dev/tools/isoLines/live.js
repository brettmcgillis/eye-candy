import loadImageData from '@dev/renderWorkbench/loadImageData';

import { flatView, optionsFromConfig } from '@modules/isoLines';
import {
  buildPiece,
  createIsoStage,
  pieceAt,
  rollArgs,
} from '@modules/isoLinesRender';

// Live shows the field frozen at the stills time, as a still is.
const isoLinesLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createIsoStage({
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
    }),
  flat: true,
  frame: ({ options }) => flatView(options.width / options.height),
  generate: ({ loadImage = loadImageData, options, pinned, seed }) =>
    pieceAt({
      batch: seed,
      index: 0,
      loadImage,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  load({ drawn, options, stage }) {
    stage.load(drawn, options.pixelRatio);
    stage.show(
      buildPiece(drawn, options, { time: options.stillTime, withLines: true })
    );
    return { drawn, layout: null };
  },
  name: (drawn) => drawn.name,
};

export default isoLinesLive;
