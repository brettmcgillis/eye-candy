import { cellRng, innerEdges, pick, splitCell } from './assign';
import { ccw, centroid, dist, len, sub } from './geometry';
import { cellStats } from './image';
import { opennessRamp } from './openness';
import { PATTERNS, TIER, fitsShape } from './patterns';
import { fold } from './zones';

const on = (p, s) =>
  Math.abs(dist(s.a, p) + dist(p, s.b) - dist(s.a, s.b)) < 1e-6;

// Everything one tiling cell contributes: its jigumi, the finer jigumi of any
// subdivision, and each leaf's infill, as width-tagged segments. `infill:
// false` decides the leaves and skips drawing them.
export default function planCell(top, ctx, { infill = true } = {}) {
  const { config, favourite, pool, sampler, widths, zoneOf } = ctx;
  const imageMode = sampler ? config.imageMode : 'off';
  const segments = top.map((a, i) => ({
    a,
    b: top[(i + 1) % top.length],
    boundary: true,
    level: 0,
    tier: TIER.jigumi,
    width: widths(0)[TIER.jigumi],
  }));
  const leaves = [];

  const choose = (sides, zone, rng) =>
    rng() < config.zoneMix ? pick(pool, sides, rng) : favourite(zone, sides);

  // Brighter image, more open pattern: the backlit paper shows the picture.
  const halftone = (sides, level, stats, rng) => {
    const rampKey = `${sides}:${level}`;
    if (!ctx.ramps.has(rampKey)) {
      ctx.ramps.set(rampKey, opennessRamp(pool, sides, level, config, widths));
    }
    const ramp = ctx.ramps.get(rampKey);
    if (ramp.length === 0) return 'plain';
    const t = stats.luma + (rng() - 0.5) * config.halftoneDither;
    const at = Math.round(Math.max(0, Math.min(1, t)) * (ramp.length - 1));
    return ramp[at];
  };

  const focus = (poly, c, zone) => {
    const r = Math.min(1, len(ctx.normalize(c)));
    switch (config.splitFocus) {
      case 'center':
        return 1.5 * (1 - r);
      case 'edges':
        return 1.5 * r;
      case 'zones':
        return poly.some((p) => zoneOf(p) !== zone) ? 1.6 : 0.25;
      default:
        return 1;
    }
  };

  // Busy image regions split: the spread a cell may hold before it does
  // falls from 0.3 to 0.02 across imageDetail.
  const splits = (poly, c, zone, level, stats, rng) => {
    if (level >= config.subdivide) return false;
    if (stats) {
      const busy = stats.spread > 0.3 - 0.28 * config.imageDetail;
      // A halftone also splits the darkest cells: finer lattice is more
      // wood and less light.
      const dark =
        imageMode === 'halftone' && stats.luma < 0.32 - 0.12 * level;
      return busy || dark;
    }
    return rng() < config.splitChance * focus(poly, c, zone);
  };

  const place = (raw, level, inherited) => {
    const poly = ccw(raw);
    const c = centroid(poly);
    const zone = zoneOf(c);
    const rng = cellRng(
      config.seed,
      fold(sub(c, ctx.center), config.symmetry),
      config.cellSize / 8,
      level
    );
    const sides = poly.length;
    const stats = imageMode === 'off' ? null : cellStats(poly, sampler);
    let pattern;
    if (imageMode === 'halftone') pattern = halftone(sides, level, stats, rng);
    else {
      const keep =
        inherited && fitsShape(inherited, sides) && rng() >= config.childMix;
      pattern = keep ? inherited : choose(sides, zone, rng);
    }

    const children = splits(poly, c, zone, level, stats, rng)
      ? splitCell(poly)
      : null;
    if (children) {
      innerEdges(poly, children).forEach(([a, b]) =>
        segments.push({
          a,
          b,
          level: level + 1,
          tier: TIER.jigumi,
          width: widths(level + 1)[TIER.jigumi],
        })
      );
      children.forEach((child) => place(child, level + 1, pattern));
      return;
    }

    leaves.push({ center: c, level, pattern, poly, sides, stats, zone });
    if (!infill) return;
    PATTERNS[pattern]
      .build(poly, config, rng)
      .forEach((s) =>
        segments.push({ ...s, level, width: widths(level)[s.tier] })
      );
  };

  place(top, 0, null);

  // Each leaf side carries the widest jigumi lying along it, so a child on
  // its parent's side keeps the parent's strip.
  const jigumi = segments.filter((s) => s.tier === TIER.jigumi);
  leaves.forEach((leaf) => {
    Object.assign(leaf, {
      edgeWidths: leaf.poly.map((a, i) => {
        const b = leaf.poly[(i + 1) % leaf.poly.length];
        return Math.max(
          0,
          ...jigumi.filter((s) => on(a, s) && on(b, s)).map((s) => s.width)
        );
      }),
    });
  });
  return { leaves, segments };
}
