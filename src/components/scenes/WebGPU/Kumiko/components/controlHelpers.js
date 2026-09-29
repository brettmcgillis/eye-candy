import { sceneDefaults } from '@modules/kumiko';

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
        String(option).charAt(0).toUpperCase() + String(option).slice(1),
        option,
      ])
    ),
    value,
  };
}

// Hides a control while it can have no effect on the panel, so nothing in
// the panel looks like it ignores an edit.
export const shownWhen = (control, paths, test) => ({
  ...control,
  render: (get) => test(...paths.map((path) => get(`Kumiko.${path}`))),
});
