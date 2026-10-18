import { folder } from 'leva';

import {
  BURN_CYCLE,
  BURN_DOWN,
  BURN_HOLD,
  EMBERS_LIFE,
} from '../../utils/campfire/fireLighting';

export const CAMPFIRE_KEYS = [
  'campfirePosition',
  'campfireBurnMode',
  'campfireFireLife',
  'campfireBurnSeconds',
  'campfireResolution',
  'campfireGhostLight',
  'ghostPosition',
  'ghostScale',
];

export default function getCampfireControls(p, folderPath) {
  return folder(
    {
      campfirePosition: {
        label: 'Fire Position',
        value: p.campfirePosition,
        step: 0.05,
      },
      campfireBurnMode: {
        label: 'Burn',
        value: p.campfireBurnMode,
        options: {
          'Cycle (original)': BURN_CYCLE,
          Hold: BURN_HOLD,
          'Burn Down': BURN_DOWN,
        },
      },
      campfireFireLife: {
        label: 'Hold Level (≤0 embers)',
        value: p.campfireFireLife,
        min: Math.floor(EMBERS_LIFE * 100) / 100,
        max: 1,
        step: 0.01,
        render: (get) => get(`${folderPath}.campfireBurnMode`) === BURN_HOLD,
      },
      campfireBurnSeconds: {
        label: 'Burn Down (s)',
        value: p.campfireBurnSeconds,
        min: 10,
        max: 1800,
        step: 5,
        render: (get) => get(`${folderPath}.campfireBurnMode`) === BURN_DOWN,
      },
      campfireResolution: {
        label: 'Render Height (px)',
        value: p.campfireResolution,
        min: 240,
        max: 1440,
        step: 10,
      },
      campfireGhostLight: {
        label: 'Firelight On Ghost',
        value: p.campfireGhostLight,
        min: 0,
        max: 4,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
