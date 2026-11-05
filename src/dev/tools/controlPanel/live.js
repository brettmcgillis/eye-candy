import resolveDesign from '@dev/controlPanelDesigns/resolveDesign';

import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/controlPanel';
import {
  createPanelStage,
  panelAt,
  rollArgs,
} from '@modules/controlPanelRender';

const controlPanelLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createPanelStage({
      height: options.height * options.pixelRatio,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ drawn, layout, options }) =>
    frameView({
      bounds: layout,
      detail: drawn.panel.detail,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  async generate({ options, pinned, seed }) {
    const roll = rollArgs({ options, typed: pinned });
    const value = options.panelDesign || roll.base.panelDesign;
    if (value) roll.pinned.panelDesign = await resolveDesign(value);
    return panelAt({ batch: seed, index: 0, roll });
  },
  hint: 'Drag a socket to patch, a plug to unplug, or a cable to pull it; Keep saves the edited drape',
  keep: (drawn, stage) =>
    optionsFromConfig(stage?.exportConfig() ?? drawn.config),
  name: (drawn) => drawn.name,
};

export default controlPanelLive;
