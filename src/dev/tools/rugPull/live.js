import { optionsFromConfig } from '@modules/rugPull';
import {
  RUG_VIEWS,
  createRugStage,
  drape,
  rollArgs,
  rugAt,
  rugView,
} from '@modules/rugPullRender';

// Live drapes the rug for the first 3D view in the form (floor by default);
// the plot is the knot chart.
const modeOf = (options) =>
  String(options.views)
    .split(',')
    .map((view) => view.trim())
    .find((view) => view in RUG_VIEWS) ?? 'floor';

const rugPullLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createRugStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout }) => layout.view,
  generate: ({ options, pinned, seed }) =>
    rugAt({
      batch: seed,
      index: 0,
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  load({ drawn, options, stage }) {
    const mode = modeOf(options);
    stage.load(drawn);
    const draped = drape(drawn, mode, options.settleSteps);
    stage.show(draped, { config: drawn.config, mode });
    const view = rugView(drawn, draped, mode, options.width / options.height);
    return { drawn, layout: { view } };
  },
  name: (drawn) => drawn.name,
};

export default rugPullLive;
