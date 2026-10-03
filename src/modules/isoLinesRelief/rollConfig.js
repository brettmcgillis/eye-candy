/* eslint-disable no-param-reassign */
import {
  SHARED_ROLLS,
  between,
  createRoller,
  hsl,
  pick,
} from '@modules/isoLines';

import * as relief from './renderOptions.mjs';

const rollIsoLinesReliefConfig = createRoller(relief, {
  ...SHARED_ROLLS,
  contours(config, rng) {
    config.style = pick(rng, relief.RELIEF_STYLES);
  },
  form(config, rng) {
    config.wallMode = rng.chance(0.75) ? 'solid' : 'floating';
    config.lineExtrude = rng.chance(0.7) ? 'height' : 'time';
    config.groundColor = hsl(rng() * 360, 0.15, between(rng, 0.04, 0.1));
  },
});

export default rollIsoLinesReliefConfig;
