import { clamp } from './math';

export const HISTORY_GRID = 32;
export const HISTORY_MAX_CIRCLES = 2000;

const circle = (x, z, radius) => ({
  k: 1 / radius,
  kc: [x / radius, z / radius],
});
const keyOf = ({ k, kc }) =>
  [kc[0] / k, kc[1] / k, 1 / k].map((v) => Math.round(v * 1e7)).join(',');

function reflect(circles, slot) {
  let k = -circles[slot].k;
  const kc = circles[slot].kc.map((v) => -v);
  circles.forEach((c, i) => {
    if (i !== slot) {
      k += 2 * c.k;
      kc[0] += 2 * c.kc[0];
      kc[1] += 2 * c.kc[1];
    }
  });
  return { k, kc };
}

function buildCircles(minRadius) {
  const radius = 2 * Math.sqrt(3) - 3;
  const root = [
    circle(0, 0, -1),
    ...[0, 1, 2].map((i) => {
      const angle = (i * Math.PI * 2) / 3;
      return circle(
        (1 - radius) * Math.cos(angle),
        (1 - radius) * Math.sin(angle),
        radius
      );
    }),
  ];
  const seen = new Set(root.map(keyOf));
  const out = [];
  const emit = ({ k, kc }) => {
    const id = out.length / 4;
    out.push(kc[0] / k, kc[1] / k, 1 / k, ((id + 1) * 0.61803398875) % 1);
  };
  root.slice(1).forEach(emit);
  const queue = [{ circles: root, skip: -1 }];
  for (
    let head = 0;
    head < queue.length && out.length / 4 < HISTORY_MAX_CIRCLES;
    head += 1
  ) {
    const { circles, skip } = queue[head];
    for (
      let slot = 0;
      slot < 4 && out.length / 4 < HISTORY_MAX_CIRCLES;
      slot += 1
    ) {
      if (slot !== skip) {
        const next = reflect(circles, slot);
        const key = keyOf(next);
        if (next.k > 0 && 1 / next.k >= minRadius && !seen.has(key)) {
          seen.add(key);
          emit(next);
          queue.push({
            circles: circles.map((c, i) => (i === slot ? next : c)),
            skip: slot,
          });
        }
      }
    }
  }
  return Float32Array.from(out);
}

function buildGrid(circles) {
  const cell = 2 / HISTORY_GRID;
  const lists = Array.from({ length: HISTORY_GRID ** 2 }, () => []);
  const cellOf = (v) => clamp(Math.floor((v + 1) / cell), 0, HISTORY_GRID - 1);
  for (let o = 0; o < circles.length; o += 4) {
    const reach = circles[o + 2] + cell;
    for (
      let z = cellOf(circles[o + 1] - reach);
      z <= cellOf(circles[o + 1] + reach);
      z += 1
    ) {
      for (
        let x = cellOf(circles[o] - reach);
        x <= cellOf(circles[o] + reach);
        x += 1
      ) {
        lists[z * HISTORY_GRID + x].push(o / 4);
      }
    }
  }
  const starts = new Uint32Array(lists.length + 1);
  lists.forEach((list, i) => {
    starts[i + 1] = starts[i] + list.length;
  });
  const indices = new Uint32Array(starts[lists.length]);
  lists.forEach((list, i) => indices.set(list, starts[i]));
  return { indices, starts };
}

let cached = null;

export function historyPackingFor(config) {
  if (cached?.minRadius !== config.historyMinRadius) {
    const circles = buildCircles(config.historyMinRadius);
    cached = {
      circles,
      grid: buildGrid(circles),
      minRadius: config.historyMinRadius,
    };
  }
  return cached;
}

export function historyTimeAt(config, y) {
  return (
    config.historyTime -
    (0.5 - y / config.historyHeight) * config.historySeconds
  );
}

export function historyWarpAt(config, seconds) {
  const radius = config.historyWarp * (0.65 + 0.35 * Math.sin(seconds * 0.43));
  return [radius * Math.cos(seconds * 0.27), radius * Math.sin(seconds * 0.27)];
}

export function historyPoint(config, x, z, seconds, inverse = false) {
  const angle = seconds * config.historyTwist;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  let [ax, az] = historyWarpAt(config, seconds);
  let qx = x;
  let qz = z;
  if (inverse) {
    qx = c * x + s * z;
    qz = -s * x + c * z;
    ax = -ax;
    az = -az;
  }
  const dx = 1 + ax * qx + az * qz;
  const dz = ax * qz - az * qx;
  const denom = dx * dx + dz * dz;
  const rx = ((qx + ax) * dx + (qz + az) * dz) / denom;
  const rz = ((qz + az) * dx - (qx + ax) * dz) / denom;
  return inverse ? [rx, rz] : [c * rx - s * rz, s * rx + c * rz];
}

function transformCircle(circles, o, gap, ax, az, c, s) {
  const x = circles[o];
  const z = circles[o + 1];
  const r = circles[o + 2] * (1 - gap);
  const a2 = ax * ax + az * az;
  const dx = 1 + ax * x + az * z;
  const dz = ax * z - az * x;
  const denom = dx * dx + dz * dz - a2 * r * r;
  const nx = ((x + ax) * dx + (z + az) * dz - ax * r * r) / denom;
  const nz = ((z + az) * dx - (x + ax) * dz - az * r * r) / denom;
  return { x: c * nx - s * nz, z: s * nx + c * nz, r: (r * (1 - a2)) / denom };
}

export function historyCirclesAt(config, y) {
  const { circles } = historyPackingFor(config);
  const seconds = historyTimeAt(config, y);
  const [ax, az] = historyWarpAt(config, seconds);
  const angle = seconds * config.historyTwist;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = [];
  for (let o = 0; o < circles.length; o += 4) {
    out.push({
      ...transformCircle(circles, o, config.historyGap, ax, az, c, s),
      trap: circles[o + 3],
      depth: clamp(Math.log2(1 / circles[o + 2]) / 7, 0, 1),
    });
  }
  return out;
}

// Circle boundaries move at a bounded speed under the disk automorphism.
// Including the vertical time gradient prevents stepping through bending tubes.
export function historyLipschitz(config) {
  const speed =
    (2 * config.historyWarp * 0.4205) / (1 - config.historyWarp) +
    Math.abs(config.historyTwist);
  return Math.hypot(1, (speed * config.historySeconds) / config.historyHeight);
}

export default function createHistoryField(config) {
  const { circles, grid } = historyPackingFor(config);
  const lipschitz = historyLipschitz(config);
  const half = config.historyHeight / 2;
  return (p) => {
    const radial = Math.hypot(p[0], p[2]);
    const seconds = historyTimeAt(config, clamp(p[1], -half, half));
    const [ax, az] = historyWarpAt(config, seconds);
    const c = Math.cos(seconds * config.historyTwist);
    const sn = Math.sin(seconds * config.historyTwist);
    const [x, z] = historyPoint(
      config,
      p[0] / Math.max(1, radial),
      p[2] / Math.max(1, radial),
      seconds,
      true
    );
    const cell = (v) =>
      clamp(Math.floor(((v + 1) * HISTORY_GRID) / 2), 0, HISTORY_GRID - 1);
    const index = cell(z) * HISTORY_GRID + cell(x);
    let d =
      ((2 / HISTORY_GRID) * (1 - config.historyWarp)) /
      (1 + config.historyWarp);
    let trap = 0;
    let radius = 1;
    for (let i = grid.starts[index]; i < grid.starts[index + 1]; i += 1) {
      const o = grid.indices[i] * 4;
      const circleAt = transformCircle(
        circles,
        o,
        config.historyGap,
        ax,
        az,
        c,
        sn
      );
      const distance =
        Math.hypot(
          p[0] / Math.max(1, radial) - circleAt.x,
          p[2] / Math.max(1, radial) - circleAt.z
        ) - circleAt.r;
      if (distance < d) {
        d = distance;
        trap = circles[o + 3];
        radius = circles[o + 2];
      }
    }
    return {
      s: Math.max(d / lipschitz, radial - 1, Math.abs(p[1]) - half),
      trap,
      depth: clamp(Math.log2(1 / radius) / 7, 0, 1),
    };
  };
}
