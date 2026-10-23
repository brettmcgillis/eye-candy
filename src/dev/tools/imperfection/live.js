import loadImageData from '@dev/renderWorkbench/loadImageData';

import {
  configFrom,
  optionsFromConfig,
  resolveViews,
} from '@modules/imperfection';
import {
  createPaintStage,
  paintingAt,
  paintingView,
  rollArgs,
} from '@modules/imperfectionRender';

// The painting runs on the Live clock; a capture is the frame on screen.
const imperfectionLive = {
  configOf: (drawn) => configFrom(drawn.config),
  createStage: ({ loadImage = loadImageData, readFrame, renderer }) =>
    createPaintStage({ loadImage, readFrame, renderer }),
  flat: true,
  frame: ({ options }) => paintingView(resolveViews(options.views)[0]),
  generate: ({ options, pinned, seed }) =>
    paintingAt({
      batch: seed,
      index: 0,
      options,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(configFrom(drawn.config)),
  name: (drawn) => drawn.name,
  stageKey: () => 'paint',
};

export default imperfectionLive;
