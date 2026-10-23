import { optionsFromConfig, resolveViews } from '@modules/blockParty';
import {
  cityAt,
  createCityStage,
  frameView,
  rollArgs,
} from '@modules/blockPartyRender';

const blockPartyLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createCityStage({
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
      view: resolveViews(options.views)[0] ?? 'front',
    }),
  generate: ({ options, pinned, seed }) =>
    cityAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default blockPartyLive;
