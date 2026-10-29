import {
  frameView,
  optionsFromConfig,
  patternAt,
  resolveViews,
  rollArgs,
} from '@modules/argyle';
import { createStage } from '@modules/argyleRender';

export default {
  cameraKeys: ({ view }) => ({ cameraFrame: view }),
  configOf: (drawn) => drawn.snapshot ?? drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createStage({
      ...options,
      width: options.width * options.pixelRatio,
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
    }),
  frame: ({ layout, options }) =>
    frameView({
      bounds: layout,
      options,
      view: resolveViews(options.views)[0] ?? 'front',
    }),
  generate: ({ options, pinned, seed }) =>
    patternAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.snapshot ?? drawn.config),
  name: (drawn) => drawn.name,
  checks: [
    {
      base: { dimension: 'relief', lowerStyle: 'hollow' },
      keep: 'relief,layout',
    },
    {
      base: {
        dimension: 'extruded',
        pattern: 'logo',
        lowerStyle: 'hollow',
        upperStyle: 'hollow',
      },
      keep: 'relief,layout',
    },
  ],
  hint: 'Space pauses • F frames • Capture freezes both image and vector plot',
};
