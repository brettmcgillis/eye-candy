import loadImageData from '@dev/renderWorkbench/loadImageData';

import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/subdivisionRelief';
import {
  createReliefStage,
  pieceAt,
  rollArgs,
} from '@modules/subdivisionReliefRender';

const subdivisionReliefLive = {
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
      config: drawn.config,
      options,
      piece: drawn.piece,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ loadImage = loadImageData, options, pinned, seed }) =>
    pieceAt({
      index: 0,
      loadImage,
      options: { ...options, batch: seed },
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => String(drawn.name),
};

export default subdivisionReliefLive;
