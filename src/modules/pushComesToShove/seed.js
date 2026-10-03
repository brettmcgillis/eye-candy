import { mulberry32 } from '@utils/noise2d';

import { puckBackOf } from './layout';

const WAVES = 3;

function routeAround(x, y, cylinders, clearance) {
  return cylinders.reduce(
    ([px, py], cylinder) => {
      const dx = px - cylinder.x;
      const dy = py - cylinder.y;
      const distance = Math.hypot(dx, dy);
      const reach = cylinder.radius + clearance;
      if (distance >= reach) return [px, py];
      if (distance < 1e-6) return [cylinder.x + reach, py];
      return [
        cylinder.x + (dx * reach) / distance,
        cylinder.y + (dy * reach) / distance,
      ];
    },
    [x, y]
  );
}

// Wires start as one coherent ripple so neighbours begin parallel instead of
// interpenetrating; the ripple's amplitude is whatever makes the rest length
// fit the span, and the writhe breaks the coherence within a second or two.
const TUCK_FADE = 0.4;

// A point near a puck drops in behind it, easing back up over TUCK_FADE so
// the wire is not kinked; with no room behind, it goes round instead.
function tuckBehind(x, y, z, cylinders, clearance, behind) {
  return cylinders.reduce((tz, cylinder) => {
    const d = Math.hypot(x - cylinder.x, y - cylinder.y);
    const reach = cylinder.radius + clearance;
    const t = Math.min(Math.max((d - reach) / TUCK_FADE, 0), 1);
    return Math.min(tz, behind + (z - behind) * t);
  }, z);
}

export function seedWires(config, layout, cylinders) {
  const { collideRadius, pointsPerWire, wireCount, zBack, zFront } = layout;
  const random = mulberry32(config.wireSeed);
  const width = layout.fieldHalfWidth * 2;
  const band = Math.max(zFront - zBack - collideRadius * 2, collideRadius);
  const cols = Math.max(1, Math.round(Math.sqrt((wireCount * width) / band)));
  const rows = Math.ceil(wireCount / cols);
  const span = layout.fieldHalfHeight * 2;
  const slack = Math.max(config.wireSlack, 1.0001);
  const amplitude =
    (span / (2 * Math.PI * WAVES)) * Math.sqrt(2 * (slack * slack - 1));

  const anchors = new Float32Array(wireCount * 4);
  const positions = new Float32Array(layout.pointCount * 4);
  const behind = puckBackOf(config, layout) - collideRadius;
  const tuck = behind >= zBack + collideRadius;

  for (let w = 0; w < wireCount; w += 1) {
    const col = w % cols;
    const row = Math.floor(w / cols);
    const x =
      -layout.fieldHalfWidth + ((col + 0.1 + random() * 0.8) / cols) * width;
    const z =
      zBack + collideRadius + ((row + 0.1 + random() * 0.8) / rows) * band;
    const skew = (random() - 0.5) * config.wireTangle;
    const zSkew = (random() - 0.5) * band * Math.min(config.wireTangle, 1);
    const clampZ = (v) =>
      Math.min(Math.max(v, zBack + collideRadius), zFront - collideRadius);
    const anchorX = (ax, y) => routeAround(ax, y, cylinders, collideRadius)[0];
    const top = [anchorX(x + skew, layout.fieldHalfHeight), clampZ(z + zSkew)];
    const bottom = [
      anchorX(x - skew, -layout.fieldHalfHeight),
      clampZ(z - zSkew),
    ];
    anchors.set([top[0], top[1], bottom[0], bottom[1]], w * 4);

    const phase = random() * 0.08;
    for (let t = 0; t < pointsPerWire; t += 1) {
      const s = t / (pointsPerWire - 1);
      const ripple = Math.sin((s * WAVES + phase) * Math.PI * 2) * amplitude;
      const envelope = Math.sin(s * Math.PI);
      const i = (w * pointsPerWire + t) * 4;
      const x0 = bottom[0] + (top[0] - bottom[0]) * s + ripple * envelope;
      const y0 = -layout.fieldHalfHeight + span * s;
      const z0 = bottom[1] + (top[1] - bottom[1]) * s;
      if (tuck) {
        positions.set(
          [x0, y0, tuckBehind(x0, y0, z0, cylinders, collideRadius, behind), 0],
          i
        );
      } else {
        const [px, py] = routeAround(x0, y0, cylinders, collideRadius);
        positions.set([px, py, z0, 0], i);
      }
    }
  }

  return { anchors, positions };
}

const CANDIDATES = 40;

// Mitchell's best-candidate sampling: each cylinder takes whichever of a few
// random spots leaves the widest gap to the others, so they spread evenly
// without a rejection loop that can fail to place one.
export function seedCylinders(config, layout) {
  const count = config.cylinderCount;
  const random = mulberry32(config.wireSeed * 31 + 17);
  const mid = (layout.zFront + layout.zBack) * 0.5;
  const bodies = new Float32Array(count * 4);
  const motion = new Float32Array(count * 4);
  const lanes = new Float32Array(count * 4);
  const placed = [];

  for (let s = 0; s < count; s += 1) {
    const radius =
      config.cylinderRadiusMin +
      random() * (config.cylinderRadiusMax - config.cylinderRadiusMin);
    const spanX = Math.max(layout.fieldHalfWidth - radius, 0);
    const spanY = Math.max(layout.fieldHalfHeight - radius, 0);
    let best = null;
    for (let c = 0; c < CANDIDATES; c += 1) {
      const x = (random() * 2 - 1) * spanX;
      const y = (random() * 2 - 1) * spanY;
      const gap = placed.reduce(
        (g, o) => Math.min(g, Math.hypot(x - o.x, y - o.y) - radius - o.radius),
        Infinity
      );
      if (!best || gap > best.gap) best = { gap, radius, x, y };
    }
    placed.push(best);
    bodies.set([best.x, best.y, mid, radius], s * 4);
    lanes.set([best.x, best.y, radius, random() * 100], s * 4);
  }

  return { bodies, lanes, motion, placed };
}
