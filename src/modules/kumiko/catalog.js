import { createRng, hashSeed } from '@modules/flora';

import arrange from './arrangement';
import { centroid, dist, insetPolygon, signedArea } from './geometry';
import { PATTERNS } from './patterns';

const ICE_VARIANTS = 4;
const round = (v) => Math.round(v * 100) / 100;
const hash01 = (text) => (hashSeed(text) % 100003) / 100003;

const cache = new Map();

export const catalogSignature = (config) =>
  [
    config.levelThinning,
    config.jigumiWidth,
    config.infillWidth,
    config.detailWidth,
    config.inner,
    config.twist,
    config.inset,
    config.iceCuts,
  ].join(':');

// The rotation of a leaf's side widths that reads smallest, so every leaf
// that is the same cell turned shares one entry. Returns the vertex the
// canonical cell starts from. A phased leaf may only start on a corner of
// its own parity.
function canonicalStart(widths, phase = -1) {
  const n = widths.length;
  let best = 0;
  let bestKey = null;
  const step = phase >= 0 ? 2 : 1;
  for (let k = Math.max(0, phase) % step; k < n; k += step) {
    const key = widths.map((_, j) => round(widths[(j + k) % n])).join(',');
    if (bestKey === null || key < bestKey) {
      best = k;
      bestKey = key;
    }
  }
  return { key: bestKey, start: best };
}

// Where a leaf sits and which baked cell it is: the entry key, its centre,
// and the angle of the vertex the entry starts from.
export function placeLeaf(leaf, signature) {
  const { key: widthKey, start } = canonicalStart(
    leaf.edgeWidths,
    leaf.phase ?? -1
  );
  const first = leaf.poly[start];
  const edge = dist(leaf.poly[0], leaf.poly[1]);
  const variant =
    leaf.pattern === 'iceRay'
      ? hashSeed(`${round(leaf.center[0])},${round(leaf.center[1])}`) %
        ICE_VARIANTS
      : 0;
  return {
    angle: Math.atan2(first[1] - leaf.center[1], first[0] - leaf.center[0]),
    entry: [
      signature,
      leaf.pattern,
      leaf.sides,
      round(edge),
      leaf.level,
      widthKey,
      variant,
    ].join('|'),
  };
}

// One cell baked in its own frame (millimetres, y down, centred, first
// vertex on +x): the inner half of each side's jigumi mitred at the
// corners, so neighbours meet on the centreline; the infill pieces; solid
// fill for collapsed faces; and the faces out to the strip centrelines for
// the paper. Faces and pieces carry a size and a random tone of their own.
function bake(entryKey, config, widths) {
  const [, pattern, sides, edge, level, widthKey, variant] =
    entryKey.split('|');
  const n = Number(sides);
  const sideWidths = widthKey.split(',').map(Number);
  const radius = Number(edge) / (2 * Math.sin(Math.PI / n));
  const poly = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    return [radius * Math.cos(a), radius * Math.sin(a)];
  });
  const w = widths(Number(level));
  const rng = createRng(`${pattern}:${variant}`);
  const infill = PATTERNS[pattern]
    .build(poly, config, rng)
    .map((s) => ({ ...s, width: w[s.tier] }));
  const { faces, pieces } = arrange([
    ...poly.map((a, i) => ({
      a,
      b: poly[(i + 1) % n],
      boundary: true,
      width: sideWidths[i],
    })),
    ...infill,
  ]);
  const area = signedArea(poly);
  const pocket = insetPolygon(
    poly,
    sideWidths.map((sw) => sw / 2)
  );

  return {
    area,
    open:
      faces
        .filter((f) => f.opening)
        .reduce((sum, f) => sum + signedArea(f.opening), 0) / area,
    pieces: pieces
      .filter((p) => !p.boundary)
      .map((p, i) => ({
        a: p.a,
        b: p.b,
        polygon: p.polygon,
        random: hash01(`${entryKey}:piece:${i}`),
        tier: p.tier,
      })),
    ring: poly.map((a, i) => ({
      a,
      b: poly[(i + 1) % n],
      polygon: [a, poly[(i + 1) % n], pocket[(i + 1) % n], pocket[i]],
    })),
    solids: faces.filter((f) => !f.opening).map((f) => f.outline),
    tiles: faces.map((f, i) => ({
      poly: f.outline,
      random: hash01(`${entryKey}:face:${i}`),
      size: signedArea(f.outline) / area,
      center: centroid(f.outline),
    })),
  };
}

export function catalogEntry(entryKey, config, widths) {
  if (!cache.has(entryKey)) {
    cache.set(entryKey, bake(entryKey, config, widths));
    if (cache.size > 2000) cache.delete(cache.keys().next().value);
  }
  return cache.get(entryKey);
}
