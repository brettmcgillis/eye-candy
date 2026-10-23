import { configFrom, optionsFromConfig, resolveViews } from '@modules/apollian';
import {
  createApollianStage,
  framingFor,
  objectAt,
  rollArgs,
} from '@modules/apollianRender';

// Live orbits the object; the slice view is the plot (and a still view).
const apollianLive = {
  configOf: (drawn) => configFrom(drawn.config),
  createStage: ({ options, readFrame, renderer }) =>
    createApollianStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ drawn, options }) =>
    framingFor(
      drawn.config,
      options,
      resolveViews(options.views).find((view) => view !== 'slice') ?? 'hero'
    ),
  generate: ({ options, pinned, seed }) =>
    objectAt({
      batch: seed,
      index: 0,
      options,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(configFrom(drawn.config)),
  name: (drawn) => drawn.name,
};

export default apollianLive;
