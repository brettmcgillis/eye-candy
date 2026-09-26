import SCENE_DEFAULTS from '../presets/defaults';

export function presetReader(preset) {
  return (key) => preset[key] ?? SCENE_DEFAULTS[key];
}

export function range(label, value, min, max, step) {
  return { label, max, min, step, value };
}

export function color(label, value) {
  return { label, value };
}
