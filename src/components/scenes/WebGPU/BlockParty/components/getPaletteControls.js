import { folder } from 'leva';

// The reference is four flat tones: paper, two mid-greys for card sides,
// near-black cells, plus the neon and the blue rings. Nothing is lit, so
// these values are the whole image.
export default function getPaletteControls(preset = {}) {
  return folder(
    {
      backgroundColor: {
        label: 'Paper',
        value: preset.backgroundColor ?? '#fcfcfc',
      },
      paperColor: {
        label: 'Card Top',
        value: preset.paperColor ?? '#fcfcfc',
      },
      edgeLightColor: {
        label: 'Card Side A',
        value: preset.edgeLightColor ?? '#cfcfcf',
      },
      edgeDarkColor: {
        label: 'Card Side B',
        value: preset.edgeDarkColor ?? '#adadad',
      },
      darkCardColor: {
        label: 'Dark Card',
        value: preset.darkCardColor ?? '#0b0b0b',
      },
      darkEdgeColor: {
        label: 'Dark Card Side',
        value: preset.darkEdgeColor ?? '#1c1c1c',
      },
      stairHighColor: {
        label: 'Stair High',
        value: preset.stairHighColor ?? '#b4b4b4',
      },
      stairAlphaStep: {
        label: 'Stair Step Alpha',
        max: 0.5,
        min: 0.01,
        step: 0.01,
        value: preset.stairAlphaStep ?? 0.15,
      },
      stairLowColor: {
        label: 'Stair Low',
        value: preset.stairLowColor ?? '#0d0d0d',
      },
      chevronColor: {
        label: 'Ring Blue',
        value: preset.chevronColor ?? '#00aaff',
      },
      towerStriation: {
        label: 'Tower Banding',
        max: 80,
        min: 0,
        step: 1,
        value: preset.towerStriation ?? 24,
      },
      falloffWidth: {
        label: 'Dark Falloff',
        max: 40,
        min: 0,
        step: 0.5,
        value: preset.falloffWidth ?? 10,
      },
      chevronSpacing: {
        label: 'Ring Spacing',
        max: 40,
        min: 2,
        step: 0.5,
        value: preset.chevronSpacing ?? 10,
      },
      chevronWidth: {
        label: 'Ring Width',
        max: 10,
        min: 0.25,
        step: 0.05,
        value: preset.chevronWidth ?? 1.2,
      },
      neonIntensity: {
        label: 'Neon Intensity',
        max: 8,
        min: 0,
        step: 0.05,
        value: preset.neonIntensity ?? 1.15,
      },
      glowIntensity: {
        label: 'Ring Intensity',
        max: 12,
        min: 0,
        step: 0.05,
        value: preset.glowIntensity ?? 1.8,
      },
    },
    { collapsed: true }
  );
}
