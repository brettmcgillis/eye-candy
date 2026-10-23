import { frameView, optionsFromConfig, resolveViews } from '@modules/exhibitA';
import {
  createExhibitStage,
  exhibitAt,
  rollArgs,
} from '@modules/exhibitARender';

const exhibitALive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createExhibitStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) =>
    frameView({
      layout,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ options, pinned, seed }) =>
    exhibitAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default exhibitALive;
