import loadImageData from '@dev/renderWorkbench/loadImageData';

import { optionsFromConfig } from '@modules/kumiko';
import {
  createKumikoStage,
  frameView,
  panelAt,
  rollArgs,
} from '@modules/kumikoRender';

// KumikoCLI's 3D stage in the Live tab (the `flat` view is the SVG art, so
// Live shows the panel in the round).
const kumikoLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createKumikoStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) =>
    frameView({ bounds: layout, options, view: 'angle' }),
  generate: ({ loadImage = loadImageData, options, pinned, seed }) =>
    panelAt({
      index: 0,
      loadImage,
      options: { ...options, batch: seed },
      roll: rollArgs({ options, typed: pinned }),
    }),
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.seed,
};

export default kumikoLive;
