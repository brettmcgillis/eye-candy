import { S4_OPTIONS, SCRIPT_OPTIONS } from '@modules/glyphs';

const range = (key, label, min, max, step = 0.001) => ({
  key,
  label,
  max,
  min,
  step,
  type: 'range',
});
const int = (key, label, min, max) => range(key, label, min, max, 1);
const color = (key, label) => ({ key, label, type: 'color' });
const toggle = (key, label) => ({ key, label, type: 'toggle' });

const colors = [color('ink', 'Ink'), color('paper', 'Paper')];

const strokeLook = [
  range('thickness', 'Thickness', 0, 0.25),
  range('softness', 'Softness', 0, 0.4),
  range('halo', 'Halo', 0, 1, 0.01),
  range('haloWidth', 'Halo width', 0.01, 0.5),
];

const strokeReveal = [
  toggle('reveal', 'Animate reveal'),
  range('revealSpeed', 'Reveal speed', 0, 8, 0.01),
  range('stagger', 'Stagger', 0, 5000, 0.5),
];

const spacing = [
  range('cellAspect', 'Cell aspect', 0.2, 2, 0.01),
  range('padding', 'Padding', 0, 0.45, 0.005),
  int('lineGap', 'Line gap (rows)', 0, 3),
];

const vectorLabel = (vector) => vector.join(' · ');

export const RENDER_FIELDS = {
  runes: [...colors, ...strokeLook, ...spacing, ...strokeReveal],
  script: [
    ...colors,
    int('gapX', 'Gap X (px)', 0, 8),
    int('gapY', 'Gap Y (px)', 0, 8),
    int('lineGap', 'Line gap (rows)', 0, 3),
    range('scroll', 'Scroll (px/s)', 0, 64, 0.5),
  ],
  sigil: [
    ...colors,
    ...strokeLook,
    toggle('carve', 'Carve waist'),
    toggle('baseline', 'Baseline'),
    ...spacing,
    ...strokeReveal,
  ],
};

export const GENERATOR_FIELDS = {
  runes: [
    int('salt', 'Salt', 0, 999),
    int('latticeX', 'Lattice columns', 1, 5),
    int('latticeY', 'Lattice rows', 1, 6),
    int('strokeCount', 'Strokes per glyph', 1, 64),
  ],
  script: [
    int('salt', 'Salt', 0, 999),
    {
      key: 's4',
      label: 'Pattern (s4)',
      options: S4_OPTIONS.map((value) => ({
        label: vectorLabel(value),
        value,
      })),
      type: 'vector',
    },
    {
      key: 'script',
      label: 'Script',
      options: SCRIPT_OPTIONS.map((value) => ({
        label: vectorLabel(value),
        value,
      })),
      type: 'vector',
    },
    toggle('cursive', 'Cursive'),
    { key: 'bandY', label: 'Band', type: 'band' },
    int('cellW', 'Glyph width (px)', 2, 16),
    int('cellH', 'Glyph height (px)', 1, 24),
  ],
  sigil: [
    int('salt', 'Salt', 0, 999),
    int('minEdges', 'Min edges', 1, 12),
    int('maxEdges', 'Max edges', 1, 12),
  ],
};
