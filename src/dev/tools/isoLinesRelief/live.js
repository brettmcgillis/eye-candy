import loadImageData from '@dev/renderWorkbench/loadImageData';

import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/isoLinesRelief';
import {
  buildPiece,
  createReliefStage,
  pieceAt,
  rollArgs,
} from '@modules/isoLinesReliefRender';

// Live shows the field frozen at the stills time, as a still is.
const isoLinesReliefLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createReliefStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ drawn, options }) =>
    frameView({
      aspect: options.width / options.height,
      config: drawn.config,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
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

export default isoLinesReliefLive;
