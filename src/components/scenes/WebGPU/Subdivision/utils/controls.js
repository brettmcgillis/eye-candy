import { RENDER_OPTIONS } from '@modules/subdivision';
import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

export const SCENE_LABEL = 'Subdivision';
export const DEFAULT_SEED = 'quad';

const PALETTE_OPTIONS = [PALETTE_NONE, ...PALETTE_NAMES];

// Leva inputs straight from the option schema, so the scene's ranges,
// defaults and labels cannot drift from the CLI's.
export function schemaControl(key, saved = {}, extra = {}) {
  const spec = RENDER_OPTIONS[key];
  const value = saved[key] ?? spec.default;
  const base = { label: spec.label, ...extra };

  if (key === 'palette') return { ...base, options: PALETTE_OPTIONS, value };
  if (key === 'seed') return { ...base, value: String(value ?? DEFAULT_SEED) };
  if (spec.type === 'enum') return { ...base, options: spec.choices, value };
  if (spec.type === 'number') {
    return { ...base, max: spec.max, min: spec.min, step: spec.step, value };
  }
  return { ...base, value };
}

// Keys shown only while another control has a given value.
const WHEN = {
  focalCount: ['driver', 'focal'],
  focalInvert: ['driver', 'focal'],
  focalRadius: ['driver', 'focal'],
  noiseScale: ['driver', 'noise'],
  threshold: ['driver', 'noise'],
  varianceThreshold: ['driver', 'variance'],
  fieldContrast: ['field', (v) => v !== 'none'],
  fieldOctaves: ['field', (v) => !['none', 'image'].includes(v)],
  fieldNoise: ['field', (v) => !['none', 'image'].includes(v)],
  fieldScale: ['field', (v) => !['none', 'image'].includes(v)],
  fieldWarp: ['field', (v) => !['none', 'image'].includes(v)],
  imageFit: ['field', 'image'],
  imageInvert: ['field', 'image'],
  sourceImage: ['field', () => false],
  webcamRate: ['webcam', true],
  colorSeed: ['colorMode', 'random'],
  gradientAngle: ['colorMode', 'position'],
  gradientRadial: ['colorMode', 'position'],
};

export function folderControls(folderName, keys, saved, paths) {
  return Object.fromEntries(
    keys.map((key) => {
      const rule = WHEN[key];
      const extra = rule
        ? {
            render: (get) => {
              const current = get(
                `${SCENE_LABEL}.${paths[rule[0]]}.${rule[0]}`
              );
              return typeof rule[1] === 'function'
                ? rule[1](current)
                : current === rule[1];
            },
          }
        : {};
      return [key, schemaControl(key, saved, extra)];
    })
  );
}
