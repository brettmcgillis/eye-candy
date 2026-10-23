import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/pushComesToShove';
import {
  createShoveStage,
  panelAt,
  rollArgs,
} from '@modules/pushComesToShoveRender';

const pushComesToShoveLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createShoveStage({
      height: options.height * options.pixelRatio,
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
      layout,
      options,
      view: resolveViews(options.views)[0] ?? 'front',
    }),
  generate: ({ options, pinned, seed }) =>
    panelAt({
      batch: seed,
      index: 0,
      options,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default pushComesToShoveLive;
