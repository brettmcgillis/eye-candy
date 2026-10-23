import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/hyperCubes';
import {
  createCubeStage,
  rollArgs,
  structureAt,
} from '@modules/hyperCubesRender';

const hyperCubesLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createCubeStage({
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
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ options, pinned, seed }) =>
    structureAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default hyperCubesLive;
