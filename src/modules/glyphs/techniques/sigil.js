import { STROKE_LOOK_DEFAULTS, charSeed, hash2 } from './shared';
import {
  buildStrokeNode,
  createStrokeUniforms,
  writeStrokeUniforms,
} from './strokes';

// The animated hourglass figure from plans/font.md, turned into a segment
// display: every glyph is a subset of the figure's 12 edges. Coordinates are
// the source's figure space (x -0.5..0.5, y -1..1); edge 10 starts at
// (0, -0.1) rather than d, exactly as written there. b-f and d-h overlap on
// the centre line between y -0.1 and 0.2, so `hit` is the part of each that
// only it covers — where an editor can tell them apart.
export const EDGES = [
  { label: 'a-b', points: [-0.5, -0.6, 0, -1] },
  { label: 'b-c', points: [0, -1, 0.5, -0.6] },
  { label: 'c-d', points: [0.5, -0.6, 0, -0.2] },
  { label: 'd-a', points: [0, -0.2, -0.5, -0.6] },
  { label: 'e-f', points: [-0.5, 0.6, 0, 0.2] },
  { label: 'f-g', points: [0, 0.2, 0.5, 0.6] },
  { label: 'g-h', points: [0.5, 0.6, 0, 1] },
  { label: 'h-e', points: [0, 1, -0.5, 0.6] },
  { label: 'a-e', points: [-0.5, -0.6, -0.5, 0.6] },
  { hit: [0, -1, 0, -0.1], label: 'b-f', points: [0, -1, 0, 0.2] },
  { hit: [0, 0.2, 0, 1], label: 'd-h', points: [0, -0.1, 0, 1] },
  { label: 'c-g', points: [0.5, -0.6, 0.5, 0.6] },
];

// The source's reveal loop runs i < 11, so its figure never draws c-g.
export const SOURCE_GLYPH = { edges: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };

// Figure space -> glyph space. The figure is 1 wide by 2 tall and the
// source tiles copies 1 unit apart, so a 0.5 cell aspect with no padding
// reproduces its row of five touching figures.
export const toGlyph = ([x, y]) => [x + 0.5, y * 0.5 + 0.5];

// The source carves out y in [-0.2, 0] and draws a baseline at y = 0.
const CARVE_CENTER = toGlyph([0, -0.1])[1];
const CARVE_HALF = 0.05;
const BASELINE_Y = toGlyph([0, 0])[1];

export const defaults = {
  ...STROKE_LOOK_DEFAULTS,
  baseline: false,
  carve: false,
  cellAspect: 0.5,
  maxEdges: 8,
  minEdges: 4,
  salt: 0,
};

export const generatorKeys = ['salt', 'minEdges', 'maxEdges'];

export function generateGlyph(char, params, reroll = 0) {
  const [sx, sy] = charSeed(char, params.salt + reroll * 7.77);
  const low = Math.max(1, Math.min(params.minEdges, EDGES.length));
  const high = Math.max(low, Math.min(params.maxEdges, EDGES.length));
  const [r] = hash2(sx, sy);
  const count = low + Math.floor(r * (high - low + 1));

  const ranked = EDGES.map((_, index) => ({
    index,
    rank: hash2(sx + index * 3.1, sy - index * 1.7)[0],
  })).sort((p, q) => p.rank - q.rank);

  return {
    edges: ranked
      .slice(0, count)
      .map(({ index }) => index)
      .sort((p, q) => p - q),
  };
}

function signature(glyph) {
  return glyph.edges.join(',');
}

export function generateGlyphs(charset, params) {
  const glyphs = {};
  const used = new Set();
  [...charset].forEach((char) => {
    let glyph = generateGlyph(char, params);
    for (
      let reroll = 1;
      used.has(signature(glyph)) && reroll < 64;
      reroll += 1
    ) {
      glyph = generateGlyph(char, params, reroll);
    }
    used.add(signature(glyph));
    glyphs[char] = glyph;
  });
  return { glyphs, params };
}

export function glyphSegments(glyph) {
  return [...new Set(glyph?.edges ?? [])]
    .filter((index) => EDGES[index])
    .sort((p, q) => p - q)
    .map((index) => {
      const [x1, y1, x2, y2] = EDGES[index].points;
      return { a: toGlyph([x1, y1]), b: toGlyph([x2, y2]), order: index };
    });
}

export const cellAspect = (params) => params.cellAspect;

export function createUniforms(maxCells, params) {
  const u = createStrokeUniforms(maxCells, params);
  u.carveCenter.value = CARVE_CENTER;
  u.carveHalf.value = CARVE_HALF;
  u.baselineY.value = BASELINE_Y;
  return u;
}

export const buildNode = buildStrokeNode;

export function writeUniforms(u, font, layout) {
  writeStrokeUniforms(u, {
    layout,
    params: font.params,
    segmentsFor: (key) => glyphSegments(font.glyphs[key]),
  });
  /* eslint-disable no-param-reassign */
  u.carve.value = font.params.carve ? 1 : 0;
  u.baseline.value = font.params.baseline ? 1 : 0;
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
  id: 'sigil',
  label: 'Sigil',
  writeUniforms,
};
