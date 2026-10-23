import loadImageData from '@dev/renderWorkbench/loadImageData';

import { optionsFromConfig, resolveViews } from '@modules/nestingBoxes';
import {
  createTreeStage,
  frameView,
  rollArgs,
  treeAt,
} from '@modules/nestingBoxesRender';

// The CLI's `contrast` backdrop check (a dark tree moves to white) runs on
// a render's pixels, so Live shows the tree on its rolled background.
const nestingBoxesLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({
    loadImage = (url) => loadImageData(url, 4096),
    options,
    readFrame,
    renderer,
  }) =>
    createTreeStage({
      height: options.height * options.pixelRatio,
      loadImage,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) =>
    frameView({
      bounds: layout.settled,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ options, pinned, seed }) =>
    treeAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default nestingBoxesLive;
