import { STROKE_LOOK_DEFAULTS, charSeed, hash2 } from './shared';
import {
  buildStrokeNode,
  createStrokeUniforms,
  writeStrokeUniforms,
} from './strokes';

// otaviogood's "runes" (shadertoy MsXSRn): strokes between points of a small
// lattice, each of the first four pinned to a different edge of the box. A
// glyph is stored as lattice index pairs [i1, j1, i2, j2] (j = 0 at the
// bottom), so it can be hand-edited and plotted exactly as it renders.
export const defaults = {
  ...STROKE_LOOK_DEFAULTS,
  cellAspect: 0.8,
  latticeX: 2,
  latticeY: 3,
  salt: 0,
  strokeCount: 4,
};

export const generatorKeys = ['salt', 'latticeX', 'latticeY', 'strokeCount'];

const fract = (v) => v - Math.floor(v);

// Source order: stroke 0 pinned bottom, 1 right, 2 left, 3 top.
const PIN = [
  (p) => [p[0], 0, p[2], p[3]],
  (p) => [0.999, p[1], p[2], p[3]],
  (p) => [0, p[1], p[2], p[3]],
  (p) => [p[0], 0.999, p[2], p[3]],
];

export function strokeId([i1, j1, i2, j2]) {
  const a = `${i1},${j1}`;
  const b = `${i2},${j2}`;
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function generateGlyph(char, params, reroll = 0) {
  const count = Math.max(0, Math.round(params.strokeCount));
  let [sx, sy] = charSeed(char, params.salt + reroll * 7.77);
  const strokes = [];
  const seen = new Set();

  for (let i = 0; i < count; i += 1) {
    const [x1, y1] = hash2(sx, sy);
    const [x2, y2] = hash2(sx + 1, sy + 1);
    sx += 2;
    sy += 2;

    const pos = PIN[i % 4]([
      fract(x1 * 128),
      fract(y1 * 128),
      fract(x2 * 128),
      fract(y2 * 128),
    ]);
    const stroke = [
      Math.floor(pos[0] * params.latticeX),
      Math.floor(pos[1] * params.latticeY),
      Math.floor(pos[2] * params.latticeX),
      Math.floor(pos[3] * params.latticeY),
    ];
    const id = strokeId(stroke);
    if (!seen.has(id)) {
      seen.add(id);
      strokes.push(stroke);
    }
  }

  return { strokes };
}

export function generateGlyphs(charset, params) {
  const glyphs = {};
  [...charset].forEach((char) => {
    glyphs[char] = generateGlyph(char, params);
  });
  return { glyphs, params };
}

export function latticePoint(i, j, params) {
  return [(i + 0.5) / params.latticeX, (j + 0.5) / params.latticeY];
}

export function glyphSegments(glyph, params) {
  return (glyph?.strokes ?? []).map((s, order) => ({
    a: latticePoint(s[0], s[1], params),
    b: latticePoint(s[2], s[3], params),
    order,
  }));
}

export const cellAspect = (params) => params.cellAspect;

export function createUniforms(maxCells, params) {
  return createStrokeUniforms(maxCells, params);
}

export const buildNode = buildStrokeNode;

export function writeUniforms(u, font, layout) {
  writeStrokeUniforms(u, {
    layout,
    params: font.params,
    segmentsFor: (key) => glyphSegments(font.glyphs[key], font.params),
  });
  /* eslint-disable no-param-reassign */
  u.carve.value = 0;
  u.baseline.value = 0;
  /* eslint-enable no-param-reassign */
}

export default {
  buildNode,
  cellAspect,
  createUniforms,
  defaults,
  generateGlyph,
  generateGlyphs,
  generatorKeys,
  glyphSegments,
  id: 'runes',
  label: 'Runes',
  writeUniforms,
};
