import { optionsFromConfig, resolveViews } from '@modules/fungi';
import {
  createFungiStage,
  frameView,
  rollArgs,
  specimenAt,
  stillLevelsFor,
} from '@modules/fungiRender';

const fungiLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createFungiStage({
      height: options.height * options.pixelRatio,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) => ({
    ...frameView({
      bounds: layout,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
    levels: stillLevelsFor(options),
  }),
  generate: ({ options, pinned, seed }) =>
    specimenAt({
      index: 0,
      options: { ...options, batch: seed },
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.seed,
};

export default fungiLive;
