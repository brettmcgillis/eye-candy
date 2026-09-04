import { folder } from 'leva';

import { PALETTE_NAMES } from '../utils/palette';

export default function getSandControls(p) {
  return folder(
    {
      paletteName: {
        label: 'Palette',
        value: p.paletteName,
        options: PALETTE_NAMES,
      },
      paletteMix: {
        label: 'Palette Mix',
        value: p.paletteMix,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // 0 reads the palette by the shaped field (colour follows shape); 1
      // reads it by the coordinate the sim advects, so colour flows and folds
      // through the pattern on its own.
      paletteAdvect: {
        label: 'Palette Advection',
        value: p.paletteAdvect,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Slides which part of the gradient the pattern lands on. The LUT wraps
      // mirrored, so this can run past either end without a seam.
      paletteShift: {
        label: 'Palette Shift',
        value: p.paletteShift,
        min: -1,
        max: 1,
        step: 0.01,
      },
      seed: { label: 'Seed', value: p.seed, min: 1, max: 999999, step: 1 },
      bedCount: {
        label: 'Grain Count',
        value: p.bedCount,
        min: 20000,
        max: 500000,
        step: 10000,
      },
      grainSize: {
        label: 'Grain Size',
        value: p.grainSize,
        min: 0.004,
        max: 0.05,
        step: 0.001,
      },
      grainSizeMin: {
        label: 'Size Min (x)',
        value: p.grainSizeMin,
        min: 0.01,
        max: 2,
        step: 0.05,
      },
      grainSizeMax: {
        label: 'Size Max (x)',
        value: p.grainSizeMax,
        min: 0.05,
        max: 20,
        step: 0.05,
      },
      // The fraction of grains that ramp up toward Size Max; the rest sit at
      // Size Min. 1 is an even ramp across the whole bed. 0.02 is 98% fine
      // sand with 2% coarse grains — with 220k grains that is still ~4,400 of
      // them, so go lower than feels right.
      grainSizeCoarse: {
        label: 'Coarse Fraction',
        value: p.grainSizeCoarse,
        min: 0.001,
        max: 1,
        step: 0.001,
      },
      bedRadius: {
        label: 'Bed Radius',
        value: p.bedRadius,
        min: 1,
        max: 10,
        step: 0.1,
      },
      bedThickness: {
        label: 'Sand Depth',
        value: p.bedThickness,
        min: 0.01,
        max: 0.4,
        step: 0.005,
      },
      bedBaseY: {
        label: 'Sand Height',
        value: p.bedBaseY,
        min: -0.5,
        max: 0.5,
        step: 0.005,
      },
      fieldHeightScale: {
        label: 'Field Relief',
        value: p.fieldHeightScale,
        min: 0,
        max: 0.4,
        step: 0.005,
      },
      grainRoll: {
        label: 'Roll With Slope',
        value: p.grainRoll,
        min: 0,
        max: 30,
        step: 0.5,
      },
      fieldTint: {
        label: 'Field Tint',
        value: p.fieldTint,
        min: 0,
        max: 1,
        step: 0.01,
      },
      fieldTintColor: { label: 'Field Tint Color', value: p.fieldTintColor },
      cullEnabled: { label: 'Cull By Field', value: p.cullEnabled },
      cullThreshold: {
        label: 'Cull Threshold',
        value: p.cullThreshold,
        min: 0,
        max: 1,
        step: 0.01,
      },
      cullSoftness: {
        label: 'Cull Softness',
        value: p.cullSoftness,
        min: 0.001,
        max: 0.5,
        step: 0.001,
      },
      grainRoughness: {
        label: 'Roughness',
        value: p.grainRoughness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      grainMetalness: {
        label: 'Metalness',
        value: p.grainMetalness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      grainColor: { label: 'Grain Color', value: p.grainColor },
      grainPaletteMix: {
        label: 'Mineral Mix',
        value: p.grainPaletteMix,
        min: 0,
        max: 1,
        step: 0.01,
      },
      grainColorB: { label: 'Mineral B', value: p.grainColorB },
      grainColorC: { label: 'Mineral C', value: p.grainColorC },
      grainPaletteSplitB: {
        label: 'B Threshold',
        value: p.grainPaletteSplitB,
        min: 0,
        max: 1,
        step: 0.01,
      },
      grainPaletteSplitC: {
        label: 'C Threshold',
        value: p.grainPaletteSplitC,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
