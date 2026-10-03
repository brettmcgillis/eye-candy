import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

export const num = (label, value, min, max, step, extra = {}) => ({
  default: value,
  label,
  max,
  min,
  step,
  type: 'number',
  ...extra,
});

export const choice = (label, choices, value, extra = {}) => ({
  choices,
  default: value,
  label,
  type: 'enum',
  ...extra,
});

export const flag = (label, value, extra = {}) => ({
  default: value,
  label,
  type: 'boolean',
  ...extra,
});

export const color = (label, value, extra = {}) => ({
  default: value,
  label,
  type: 'color',
  ...extra,
});

export const paletteSpec = (value) => ({
  default: value,
  label: 'Palette',
  type: 'string',
});

export const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);
export const PALETTE_OR_NONE = [
  [PALETTE_NONE, PALETTE_NONE],
  ...PALETTE_CHOICES,
];

// A kernel's option table, minus roll metadata: Darkroom never rolls, so a
// field must not render as an unpinned (disabled) dice slot.
export function fromSchema(table, keys) {
  return Object.fromEntries(
    keys.map((key) => {
      const spec = { ...table[key] };
      delete spec.facet;
      delete spec.roll;
      return [key, spec];
    })
  );
}

export function defaultsOf(specs) {
  return Object.fromEntries(
    Object.entries(specs).map(([key, spec]) => [key, spec.default])
  );
}

// Darkroom takes media, so a scene's only relevant presets are the ones it
// built for the webcam.
export const webcamPresets = (presets) =>
  Object.fromEntries(
    Object.entries(presets).filter(([, preset]) => preset.webcam === true)
  );
