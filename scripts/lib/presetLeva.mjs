import { createRequire } from 'node:module';

const { levaStore: controlStore } = createRequire(import.meta.url)('leva');

export const capture = {
  requestedPreset: null,
  preset: null,
  controls: {},
  specs: {},
};

export function reset(preset) {
  capture.requestedPreset = preset;
  capture.preset = null;
  capture.controls = {};
  capture.specs = {};
}

export function capturePresets(value) {
  capture.preset = value;
}

export const folder = (...args) => ({
  schema: args.find((value) => value && typeof value === 'object') ?? {},
  type: 'folder',
});
export const button = () => ({ type: 'button' });
export const buttonGroup = button;
export const monitor = button;
export const levaStore = { getData: () => ({}) };

export function useControls(...args) {
  const factory = args.find((value) => typeof value === 'function');
  const schema = factory
    ? factory()
    : args.find((value) => value && typeof value === 'object');
  const values = {};
  function walk(node) {
    Object.entries(node ?? {}).forEach(([key, spec]) => {
      if (spec?.type === 'folder') walk(spec.schema);
      else if (spec?.type !== 'button' && typeof spec !== 'function') {
        const described = spec && typeof spec === 'object' && 'value' in spec;
        const value = described ? spec.value : spec;
        if (value === undefined || spec?.image !== undefined) return;
        const plain = value === null || typeof value !== 'object';
        if (described || plain || Array.isArray(value) || 'x' in value) {
          const [data] = controlStore.getDataFromSchema({ [key]: spec });
          const input = data[key];
          if (!input || !('value' in input)) return;
          values[key] = input.value;
          capture.specs[key] = {
            ...(described ? spec : {}),
            value: input.value,
          };
        }
      }
    });
  }
  walk(schema);
  Object.assign(capture.controls, values);
  return factory ? [values, () => {}, () => {}] : values;
}
