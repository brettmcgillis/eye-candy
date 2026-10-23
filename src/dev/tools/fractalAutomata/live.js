import { optionsFromConfig, resolveViews } from '@modules/fractalAutomata';
import {
  createAutomataStage,
  frameView,
  rollArgs,
  settleStructure,
} from '@modules/fractalAutomataRender';

// A blind roll can grow to nothing, so the build re-rolls it as the CLI does.
const fractalAutomataLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createAutomataStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) =>
    frameView({
      bounds: layout.bounds,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  generate: ({ options, pinned, seed }) => ({
    batch: seed,
    index: 0,
    roll: rollArgs({ options, typed: pinned }),
  }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  async load({ drawn: request, stage }) {
    const { drawn, loaded } = await settleStructure(stage, request);
    return { drawn, layout: loaded };
  },
  name: (drawn) => drawn.name,
};

export default fractalAutomataLive;
