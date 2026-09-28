/* eslint-disable no-param-reassign */
import { SurfaceGrowthEngine, seedLoop } from '@modules/differentialGrowth';
import { polygonDistance } from '@utils/regularPolygon';

const UP = [0, 1, 0];

let bounds = null;
let engine = null;
let timeline = [];

// The reference's own case: the curve lives on the ground plane. The only
// thing the plane adds is the bed outline, which a point is pushed back inside
// of far enough that its ridge is not clipped by the rim.
function projectToBed(p, n) {
  p.y = 0;
  n.x = 0;
  n.y = 1;
  n.z = 0;
  if (!bounds) return;
  const { margin, radius, shape } = bounds;
  const x = p.x / radius;
  const z = p.z / radius;
  const over = polygonDistance(shape, x, z) + margin;
  if (over <= 0) return;
  const swept = Math.atan2(z, x) - shape.base;
  const angle = shape.base + Math.round(swept / shape.step) * shape.step;
  p.x -= Math.cos(angle) * over * radius;
  p.z -= Math.sin(angle) * over * radius;
}

// x, z in unit bed space and the curve's curvature, per point; a curve ends
// where the next starts, so the rasteriser needs each curve's length too.
function pack() {
  const total = engine.getTotalPointCount();
  const points = new Float32Array(total * 3);
  const lengths = new Int32Array(engine.curves.length);
  let k = 0;
  engine.curves.forEach((curve, c) => {
    lengths[c] = curve.points.length;
    curve.points.forEach((p, i) => {
      points[k * 3] = p.x / bounds.radius;
      points[k * 3 + 1] = p.z / bounds.radius;
      points[k * 3 + 2] = curve.curvature[i];
      k += 1;
    });
  });
  return { count: total, lengths, points };
}

// Each segment stamps a rounded ridge into its neighbourhood; where two meet,
// the taller wins, so neighbouring folds stay separate ridges instead of
// piling up. `.g` carries the curvature at the nearest point of the ridge.
const PROFILE_STEPS = 1024;
const PROFILE = Uint8Array.from({ length: PROFILE_STEPS }, (_, i) => {
  const s = 1 - Math.sqrt(i / PROFILE_STEPS);
  return Math.round(s * s * (3 - 2 * s) * 255);
});

function rasterize({ lengths, points }, resolution, halfWidth) {
  const field = new Uint8Array(resolution * resolution * 2);
  const toTexel = resolution * 0.5;
  const reach = halfWidth * toTexel;
  const toProfile = PROFILE_STEPS / (reach * reach);
  const stamp = (a, b) => {
    const ax = (points[a * 3] + 1) * toTexel - 0.5;
    const ay = (points[a * 3 + 1] + 1) * toTexel - 0.5;
    const bx = (points[b * 3] + 1) * toTexel - 0.5;
    const by = (points[b * 3 + 1] + 1) * toTexel - 0.5;
    const ca = points[a * 3 + 2] * 255;
    const cb = points[b * 3 + 2] * 255;
    const vx = bx - ax;
    const vy = by - ay;
    const inv = 1 / Math.max(vx * vx + vy * vy, 1e-9);
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach));
    const x1 = Math.min(resolution - 1, Math.ceil(Math.max(ax, bx) + reach));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - reach));
    const y1 = Math.min(resolution - 1, Math.ceil(Math.max(ay, by) + reach));
    for (let y = y0; y <= y1; y += 1) {
      const py = y - ay;
      for (let x = x0; x <= x1; x += 1) {
        const px = x - ax;
        let t = (px * vx + py * vy) * inv;
        t = t < 0 ? 0 : t > 1 ? 1 : t; // eslint-disable-line no-nested-ternary
        const dx = px - vx * t;
        const dy = py - vy * t;
        const k = ((dx * dx + dy * dy) * toProfile) | 0; // eslint-disable-line no-bitwise
        if (k < PROFILE_STEPS) {
          const h = PROFILE[k];
          const cell = (y * resolution + x) * 2;
          if (h > field[cell]) {
            field[cell] = h;
            field[cell + 1] = ca + (cb - ca) * t;
          }
        }
      }
    }
  };

  let base = 0;
  lengths.forEach((count) => {
    for (let i = 0; i < count; i += 1) {
      stamp(base + i, base + ((i + 1) % count));
    }
    base += count;
  });

  return field;
}

function reply(id, frame, halfWidth) {
  const field = rasterize(frame, bounds.resolution, halfWidth);
  globalThis.postMessage({ count: frame.count, field, id }, [field.buffer]);
}

function addLoop({ loopRadius, x, z }) {
  const edge = engine.settings.targetEdgeLength;
  const points = seedLoop(
    [x * bounds.radius, 0, z * bounds.radius],
    UP,
    edge,
    Math.max(loopRadius * bounds.radius, edge * 3)
  );
  if (engine.curves.length === 0) engine.setCurve(points, true);
  else engine.addCurve(points, true);
}

globalThis.onmessage = ({ data }) => {
  if (data.type === 'bounds') {
    bounds = { ...bounds, ...data.bounds };
    return;
  }
  if (data.type === 'start') {
    engine = new SurfaceGrowthEngine(
      { ...data.settings },
      data.seed,
      projectToBed
    );
    engine.gradientBlur = data.gradientBlur;
    timeline = [];
    addLoop(data.loop);
    return;
  }
  if (data.type === 'add') {
    if (engine && engine.getTotalPointCount() < engine.settings.maxVertices) {
      addLoop(data.loop);
    }
    return;
  }
  if (data.type === 'settings') {
    if (engine) {
      Object.assign(engine.settings, data.settings);
      engine.gradientBlur = data.gradientBlur;
    }
    return;
  }
  if (data.type === 'step') {
    engine.step(data.dt, data.growthSpeed, data.seedInfluence);
    const frame = pack();
    if (data.record) timeline.push(frame);
    reply(data.id, frame, data.halfWidth);
    return;
  }
  if (data.type === 'frame') {
    const frame = timeline[Math.min(data.index, timeline.length - 1)];
    if (frame) reply(data.id, frame, data.halfWidth);
  }
};
