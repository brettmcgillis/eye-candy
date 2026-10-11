import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const TINY_MOON_KEYS = [
  'tinyMoonRadius',
  'tinyMoonDisplacement',
  'tinyMoonBump',
  'tinyMoonRoughness',
  'tinyMoonTint',
];

export const LUNAR_KEYS = [
  'lunarSeed',
  'lunarCraterCount',
  'lunarMaxCrater',
  'lunarRoughness',
  'lunarCurvature',
  'lunarGrain',
  'lunarDarkColor',
  'lunarLightColor',
];

const slider = (label, value, min, max, step) => ({
  label,
  value,
  min,
  max,
  step,
});

export function getTinyMoonControls(p) {
  return folder(
    {
      tinyMoonRadius: slider('Radius', p.tinyMoonRadius, 0.5, 20, 0.1),
      tinyMoonDisplacement: slider(
        'Crater Depth',
        p.tinyMoonDisplacement,
        0,
        0.5,
        0.005
      ),
      tinyMoonBump: slider('Bump', p.tinyMoonBump, 0, 10, 0.05),
      tinyMoonRoughness: slider('Roughness', p.tinyMoonRoughness, 0, 1, 0.01),
      tinyMoonTint: { label: 'Tint', value: p.tinyMoonTint },
    },
    COLLAPSED
  );
}

export function getLunarControls(p) {
  return folder(
    {
      lunarSeed: slider('Seed', p.lunarSeed, 1, 9999, 1),
      lunarCraterCount: slider('Craters', p.lunarCraterCount, 0, 1500, 10),
      lunarMaxCrater: slider('Largest Crater (m)', p.lunarMaxCrater, 2, 120, 1),
      lunarRoughness: slider('Undulation', p.lunarRoughness, 0, 4, 0.01),
      lunarCurvature: slider(
        'Horizon Curve (m)',
        p.lunarCurvature,
        200,
        5000,
        10
      ),
      lunarGrain: slider('Regolith Grain', p.lunarGrain, 0, 2, 0.01),
      lunarDarkColor: { label: 'Dark', value: p.lunarDarkColor },
      lunarLightColor: { label: 'Light', value: p.lunarLightColor },
    },
    COLLAPSED
  );
}
