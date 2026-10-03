import { RENDER_OPTIONS } from '@modules/subdivision';
import { WEBCAM_FACING_OPTIONS } from '@modules/webcam';
import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';
import isMobileDevice from '@utils/isMobileDevice';

import { RELIEF_OPTIONS } from './reliefOptions';

export const SCENE_LABEL = 'Subdivision Relief';
export const DEFAULT_SEED = 'relief';
// The 2D look's outline band; here the gap between prisms does its job.
export const OMITTED_KEYS = ['outlineColor', 'outlineStrength', 'outlineWidth'];

const PALETTE_OPTIONS = [PALETTE_NONE, ...PALETTE_NAMES];
export const OPTIONS = { ...RENDER_OPTIONS, ...RELIEF_OPTIONS };

// Leva inputs straight from the option schema, so the scene's ranges,
// defaults and labels cannot drift from the CLI's.
export function schemaControl(key, saved = {}, extra = {}) {
  const spec = OPTIONS[key];
  const value = saved[key] ?? spec.default;
  const base = { label: spec.label, ...extra };

  if (key === 'palette') return { ...base, options: PALETTE_OPTIONS, value };
  if (key === 'seed') return { ...base, value: String(value ?? DEFAULT_SEED) };
  if (key === 'webcamFacing') {
    return { ...base, options: WEBCAM_FACING_OPTIONS, value };
  }
  if (spec.type === 'enum') return { ...base, options: spec.choices, value };
  if (spec.type === 'number') {
    return { ...base, max: spec.max, min: spec.min, step: spec.step, value };
  }
  return { ...base, value };
}

// Keys shown only while another control has a given value.
const WHEN = {
  cutDriver: ['lattice', 'rect'],
  cutMargin: ['lattice', 'rect'],
  growStyle: ['lattice', (v) => v !== 'tri'],
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
  webcamFacing: ['webcam', (v) => v && isMobileDevice()],
  webcamRate: ['webcam', true],
  colorSeed: ['colorMode', 'random'],
  gradientAngle: ['colorMode', 'position'],
  gradientRadial: ['colorMode', 'position'],
  lumaInvert: ['lumaWeight', (v) => v > 0],
  focalFalloff: ['focalWeight', (v) => v > 0],
  motionNoiseScale: ['animate', true],
  motionNoiseSpeed: ['animate', true],
  motionNoiseAmount: ['animate', true],
  motionDepth: ['animate', true],
  motionWaveAmount: ['animate', true],
  motionWaveLength: ['animate', true],
  motionWaveSpeed: ['animate', true],
  motionWaveOrigin: ['animate', true],
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
