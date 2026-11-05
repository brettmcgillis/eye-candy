import { frameView, optionsFromConfig, resolveViews } from '@modules/cables';
import {
  createCablesStage,
  generationAt,
  rollArgs,
} from '@modules/cablesRender';

const cablesLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createCablesStage({
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
      bounds: layout,
      options,
      view: resolveViews(options.views)[0] ?? 'top',
    }),
  generate: ({ options, pinned, seed }) =>
    generationAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default cablesLive;
