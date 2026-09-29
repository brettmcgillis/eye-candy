import { createRng } from '@modules/flora';

import arrange from './arrangement';
import { regularPolygon, signedArea } from './geometry';
import { PATTERNS, TIER, fitsShape } from './patterns';

const cache = new Map();

// The share of a cell a pattern leaves open, measured on a real cell of that
// shape and level: how much light it lets through the paper.
export function openness(id, sides, level, config, widths) {
  const w = widths(level);
  const key = [
    id,
    sides,
    level,
    config.cellSize,
    config.levelThinning,
    w[TIER.jigumi],
    w[TIER.infill],
    w[TIER.detail],
    config.inner,
    config.twist,
    config.inset,
    config.iceCuts,
  ].join(':');
  if (!cache.has(key)) {
    const radius =
      config.cellSize / 2 ** level / (2 * Math.sin(Math.PI / sides));
    const poly = regularPolygon([0, 0], radius, sides, 0.3);
    const segments = [
      ...poly.map((a, i) => ({
        a,
        b: poly[(i + 1) % sides],
        width: w[TIER.jigumi],
      })),
      ...PATTERNS[id]
        .build(poly, config, createRng(`${id}:open`))
        .map((s) => ({ ...s, width: w[s.tier] })),
    ];
    const open = arrange(segments)
      .faces.filter((face) => face.opening)
      .reduce((sum, face) => sum + signedArea(face.opening), 0);
    cache.set(key, open / signedArea(poly));
    if (cache.size > 4000) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}

// The pool's patterns that fit a shape, densest first — the halftone ramp.
export function opennessRamp(pool, sides, level, config, widths) {
  return pool
    .filter(({ id }) => fitsShape(id, sides))
    .map(({ id }) => ({ id, open: openness(id, sides, level, config, widths) }))
    .sort((a, b) => a.open - b.open)
    .map(({ id }) => id);
}
