import { cellRng, innerEdges, pick, splitCell } from './assign';
import { ccw, centroid, dist, len, lerp, sub } from './geometry';
import { cellStats } from './image';
import { opennessRamp } from './openness';
import { PATTERNS, TIER, fitsShape, isPhased } from './patterns';
import { fold } from './zones';

const on = (p, a, b) => Math.abs(dist(a, p) + dist(p, b) - dist(a, b)) < 1e-6;

// Each child side on its parent's side keeps that side's strip; the rest
// are the new, finer jigumi.
const childWidths = (child, parent, parentWidths, inner) =>
  child.map((a, i) => {
    const m = lerp(a, child[(i + 1) % child.length], 0.5);
    const j = parent.findIndex((p, k) =>
      on(m, p, parent[(k + 1) % parent.length])
    );
    return j >= 0 ? parentWidths[j] : inner;
  });

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
  const halftone = (sides, level, edge, stats, rng) => {
    const rampKey = `${sides}:${level}`;
    if (!ctx.ramps.has(rampKey)) {
      ctx.ramps.set(rampKey, opennessRamp(pool, sides, level, config, widths));
    }
    const ramp = ctx.ramps.get(rampKey);
    if (ramp.length === 0) return 'plain';
    // Infill on a small cell is only more wood: it stays open jigumi and its
    // paper carries the tone.
    if (edge < config.halftoneMinCell) return 'plain';
    // Brightness picks an open fraction across the ramp's range, and the
    // pattern nearest it wins: tones follow real openness, not rank.
    const t = Math.max(
      0,
      Math.min(1, stats.luma + (rng() - 0.5) * config.halftoneDither)
    );
    const lo = ramp[0].open;
    const target = lo + (ramp[ramp.length - 1].open - lo) * t;
    return ramp.reduce((best, step) =>
      Math.abs(step.open - target) < Math.abs(best.open - target) ? step : best
    ).id;
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

  // Busy image regions split, as Subdivision's variance driver does: the
  // cell's brightness range passes the threshold.
  const splits = (poly, c, zone, level, stats, rng) => {
    if (level >= config.subdivide) return false;
    if (stats) {
      const busy = stats.range > config.varianceThreshold;
      // A halftone also splits the darkest cells: finer lattice is more
      // wood and less light.
      const dark = imageMode === 'halftone' && stats.luma < 0.32 - 0.12 * level;
      return busy || dark;
    }
    return rng() < config.splitChance * focus(poly, c, zone);
  };

  const place = (raw, level, inherited, edgeWidths) => {
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
    // A cell at the last level never splits, so it only needs its mean.
    const stats =
      imageMode === 'off'
        ? null
        : cellStats(poly, sampler, { spread: level < config.subdivide });
    let pattern;
    if (imageMode === 'halftone') {
      pattern = halftone(sides, level, dist(poly[0], poly[1]), stats, rng);
    } else {
      const keep =
        inherited && fitsShape(inherited, sides) && rng() >= config.childMix;
      pattern = keep ? inherited : choose(sides, zone, rng);
    }

    const children = splits(poly, c, zone, level, stats, rng)
      ? splitCell(poly)
      : null;
    if (children) {
      if (infill) {
        innerEdges(poly, children).forEach(([a, b]) =>
          segments.push({
            a,
            b,
            level: level + 1,
            tier: TIER.jigumi,
            width: widths(level + 1)[TIER.jigumi],
          })
        );
      }
      const inner = widths(level + 1)[TIER.jigumi];
      children.forEach((child) => {
        const turned = ccw(child);
        place(
          turned,
          level + 1,
          pattern,
          childWidths(turned, poly, edgeWidths, inner)
        );
      });
      return;
    }

    const phase = isPhased(pattern, sides) ? ctx.evenCorner(poly) : -1;
    leaves.push({
      center: c,
      edgeWidths,
      level,
      pattern,
      phase,
      poly,
      sides,
      stats,
      zone,
    });
    if (!infill) return;
    const from = Math.max(0, phase);
    PATTERNS[pattern]
      .build([...poly.slice(from), ...poly.slice(0, from)], config, rng)
      .forEach((s) =>
        segments.push({ ...s, level, width: widths(level)[s.tier] })
      );
  };

  const root = ccw(top);
  place(
    root,
    0,
    null,
    root.map(() => widths(0)[TIER.jigumi])
  );
  return { leaves, segments };
}
