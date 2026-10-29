import resolveDesign from '@dev/paperCutsDesigns/resolveDesign';

import { frameView, optionsFromConfig, resolveViews } from '@modules/paperCuts';
import {
  compositionAt,
  createPaperStage,
  rollArgs,
} from '@modules/paperCutsRender';

export default {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createPaperStage({
      ...options,
      width: options.width * options.pixelRatio,
      height: options.height * options.pixelRatio,
      renderer,
      readFrame,
    }),
  generate: async ({ options, pinned, seed }) => {
    const roll = rollArgs({ options, typed: pinned });
    const design = await resolveDesign(
      roll.pinned.paperDesign ?? roll.base.paperDesign
    );
    if (design)
      Object.assign(roll.pinned, {
        paperDesign: design.code,
        rotate: roll.pinned.rotate ?? design.rotate,
      });
    return compositionAt({ batch: seed, index: 0, roll });
  },
  frame: ({ layout, options }) =>
    frameView({
      bounds: layout,
      options,
      view: resolveViews(options.views)[0] ?? 'front',
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};
