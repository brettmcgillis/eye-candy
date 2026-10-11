import { folder } from 'leva';

import {
  WAVE_QUALITY_PRESETS,
  buildFirstWaveControls,
  buildSecondWaveControls,
} from '@modules/ifftOcean';

const COLLAPSED = { collapsed: true };

const FIRST_PREFIX = 'oceanFirst_';
const SECOND_PREFIX = 'oceanSecond_';

const OWN_KEYS = [
  'oceanQuality',
  'oceanPatchSize',
  'oceanPatchResolution',
  'oceanLodScale',
  'oceanFoamStrength',
  'oceanFoamThreshold',
  'oceanExposure',
  'oceanSkyVisible',
  'oceanSkyTurbidity',
  'oceanSkyRayleigh',
  'oceanSkyMie',
  'oceanCustomColors',
  'oceanSeaColor',
  'oceanHorizonColor',
  'oceanReflectColor',
  'oceanWaveColor',
  'oceanFadeColor',
  'oceanSpecularColor',
  'oceanFoamColor',
  'oceanSpecularStrength',
  'oceanMoonVisible',
  'oceanMoonSize',
  'oceanMoonColor',
  'oceanMoonGlow',
  'oceanGhostRide',
  'oceanGhostRock',
  'oceanGhostFollow',
];

export const OCEAN_KEYS = [
  ...OWN_KEYS,
  ...Object.keys(buildFirstWaveControls({ prefix: FIRST_PREFIX })),
  ...Object.keys(buildSecondWaveControls({ prefix: SECOND_PREFIX })),
];

const slider = (label, value, min, max, step) => ({
  label,
  value,
  min,
  max,
  step,
});

export default function getOceanControls(p) {
  return folder(
    {
      oceanQuality: {
        label: 'Quality',
        value: p.oceanQuality,
        options: Object.keys(WAVE_QUALITY_PRESETS),
      },
      oceanPatchSize: slider('Patch Size', p.oceanPatchSize, 100, 4000, 10),
      oceanPatchResolution: slider(
        'Patch Resolution',
        p.oceanPatchResolution,
        64,
        768,
        1
      ),
      oceanLodScale: slider('LOD Scale', p.oceanLodScale, 0, 20, 0.1),
      oceanFoamStrength: slider('Foam', p.oceanFoamStrength, 0, 5, 0.1),
      oceanFoamThreshold: slider(
        'Foam Threshold',
        p.oceanFoamThreshold,
        0,
        5,
        0.1
      ),
      Ghost: folder(
        {
          oceanGhostRide: slider('Ride Swell', p.oceanGhostRide, 0, 1, 0.01),
          oceanGhostRock: slider('Rock', p.oceanGhostRock, 0, 1, 0.01),
          oceanGhostFollow: slider('Follow', p.oceanGhostFollow, 0.2, 10, 0.1),
        },
        COLLAPSED
      ),
      Sky: folder(
        {
          oceanSkyVisible: { label: 'Day Sky', value: p.oceanSkyVisible },
          oceanExposure: slider('Exposure', p.oceanExposure, 0.05, 2.5, 0.01),
          oceanSkyTurbidity: slider(
            'Turbidity',
            p.oceanSkyTurbidity,
            1,
            20,
            0.1
          ),
          oceanSkyRayleigh: slider('Rayleigh', p.oceanSkyRayleigh, 0, 4, 0.01),
          oceanSkyMie: slider('Mie', p.oceanSkyMie, 0, 0.02, 0.0001),
        },
        COLLAPSED
      ),
      Colors: folder(
        {
          oceanCustomColors: { label: 'Custom', value: p.oceanCustomColors },
          oceanSeaColor: { label: 'Deep Water', value: p.oceanSeaColor },
          oceanHorizonColor: { label: 'Horizon', value: p.oceanHorizonColor },
          oceanReflectColor: {
            label: 'Sky Reflect',
            value: p.oceanReflectColor,
          },
          oceanWaveColor: { label: 'Wave Crest', value: p.oceanWaveColor },
          oceanFadeColor: { label: 'Distance', value: p.oceanFadeColor },
          oceanSpecularColor: { label: 'Glint', value: p.oceanSpecularColor },
          oceanFoamColor: { label: 'Foam', value: p.oceanFoamColor },
          oceanSpecularStrength: slider(
            'Glint Strength',
            p.oceanSpecularStrength,
            0,
            4,
            0.01
          ),
        },
        COLLAPSED
      ),
      Moon: folder(
        {
          oceanMoonVisible: { label: 'Visible', value: p.oceanMoonVisible },
          oceanMoonSize: slider('Size (°)', p.oceanMoonSize, 0.5, 15, 0.1),
          oceanMoonColor: { label: 'Color', value: p.oceanMoonColor },
          oceanMoonGlow: slider('Glow', p.oceanMoonGlow, 0, 5, 0.01),
        },
        COLLAPSED
      ),
      'First Wave Spectrum': folder(
        buildFirstWaveControls({ prefix: FIRST_PREFIX, snapshot: p }),
        COLLAPSED
      ),
      'Second Wave Spectrum': folder(
        buildSecondWaveControls({ prefix: SECOND_PREFIX, snapshot: p }),
        COLLAPSED
      ),
    },
    COLLAPSED
  );
}
