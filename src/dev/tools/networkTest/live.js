import loadImageData from '@dev/renderWorkbench/loadImageData';

import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/networkTest';
import {
  createNetworkStage,
  networkAt,
  padFor,
  rollArgs,
} from '@modules/networkTestRender';

const networkTestLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createNetworkStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ drawn, options }) =>
    frameView({
      options,
      pad: padFor(drawn),
      points: drawn.network.positions,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ loadImage = loadImageData, options, pinned, seed }) =>
    networkAt({
      batch: seed,
      index: 0,
      loadImage,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default networkTestLive;
