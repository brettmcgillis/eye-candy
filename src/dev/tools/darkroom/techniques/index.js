import { defaultsOf } from './shared/specs';

const REQUIRED = ['create', 'id', 'inputs', 'label', 'options', 'sections'];

// Every technique is a folder with a technique.js; nothing else registers it.
const modules = import.meta.glob('./*/technique.js', { eager: true });

export const TECHNIQUES = Object.entries(modules)
  .map(([file, module]) => {
    const technique = module.default;
    const missing = REQUIRED.filter((key) => technique?.[key] == null);
    if (missing.length) {
      throw new Error(`${file} is missing ${missing.join(', ')}`);
    }
    return technique;
  })
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export const techniqueById = (id) =>
  TECHNIQUES.find((technique) => technique.id === id) ?? TECHNIQUES[0];

export const engineOf = (technique, options) =>
  typeof technique.engine === 'function'
    ? technique.engine(options)
    : (technique.engine ?? 'canvas');

export const isAnimated = (technique, options) =>
  Boolean(technique.animated?.(options));

export function presetValues(technique, name) {
  const defaults = defaultsOf(technique.options);
  const preset = technique.presets?.[name] ?? {};
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(preset).filter(
        ([key, value]) => key in defaults && value != null
      )
    ),
  };
}

// A technique whose defaults hang off one choice (a variant, a mode)
// re-derives the dependent values when that choice changes.
export const deriveValues = (technique, values, changed) =>
  technique.derive ? technique.derive(values, changed) : values;

export const initialValues = (technique) =>
  deriveValues(technique, presetValues(technique, technique.defaultPreset));

export function coerce(spec, raw) {
  if (spec?.type === 'seed')
    return raw == null || raw === '' ? spec.default : raw;
  if (spec?.type !== 'number') return raw;
  const value = Number(raw);
  if (raw === '' || !Number.isFinite(value)) return spec.default;
  return Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, value));
}
