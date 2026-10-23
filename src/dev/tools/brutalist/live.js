import { Tree } from '@dgreenheck/ez-tree';

import { optionsFromConfig, resolveViews } from '@modules/brutalist';
import {
  createBrutalistStage,
  frameStructure,
  rollArgs,
  structureAt,
} from '@modules/brutalistRender';

const brutalistLive = {
  checks: [{ stage: 'maquette' }],
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createBrutalistStage({
      Tree,
      height: options.height * options.pixelRatio,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      stage: options.stage,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ drawn, layout, options }) =>
    frameStructure({
      drawn,
      options,
      stage: options.stage,
      transform: layout.transform,
      view: resolveViews(options.views)[0] ?? 'approach',
    }),
  generate: ({ options, pinned, seed }) =>
    structureAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
  stageKey: (options) =>
    JSON.stringify([
      options.width / options.height,
      options.samples,
      options.shadows,
      options.stage,
      options.transparent,
    ]),
};

export default brutalistLive;
