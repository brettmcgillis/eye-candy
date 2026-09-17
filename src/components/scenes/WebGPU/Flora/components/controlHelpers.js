import { sceneDefaults } from '@modules/flora';

const SCENE_DEFAULTS = sceneDefaults();

export function presetReader(preset) {
  return (key) => preset[key] ?? SCENE_DEFAULTS[key];
}

export function range(label, value, min, max, step) {
  return { label, max, min, step, value };
}

export function choice(label, value, options) {
  return {
    label,
    options: Object.fromEntries(
      options.map((option) => [
        option.charAt(0).toUpperCase() + option.slice(1),
        option,
      ])
    ),
    value,
  };
}
