/* eslint-disable no-bitwise */
// Three-free: a plot redraws the drops, splashes and bolt RainCloud renders.

// stylized_cloud_2.glb in model units, Y-up: its base is flat at y 0.
export const CLOUD_MODEL = { halfDepth: 71.5, halfWidth: 108.67, height: 103 };

export const RAIN_SHADOW_SIZE = 128;
export const RAIN_SHADOW_LAYER = 6;

export const RAIN_CLOUD_DEFAULTS = {
  cloudColor: '#8a93a6',
  cloudFlash: 0.8,
  cloudHeight: 0.35,
  cloudRoughness: 0.9,
  cloudSize: 0.75,
  cloudVisible: false,
  lightningBranches: 3,
  lightningColor: '#f4f7ff',
  lightningDuration: 0.6,
  lightningGlowColor: '#8fa8ff',
  lightningJitter: 0.7,
  lightningMaxGap: 7,
  lightningMinGap: 2.5,
  lightningVisible: false,
  lightningWidth: 0.004,
  rainColor: '#b9c7dd',
  rainCount: 420,
  rainLength: 0.07,
  rainOpacity: 0.55,
  rainSpeed: 2.6,
  rainSplash: 0.025,
  rainSpread: 0.8,
  rainVisible: false,
  rainWidth: 0.0022,
};

export const SPLASH_SECONDS = 0.22;
// A fixed fall keeps each drop's cycle independent of the ghost's bob.
const FALL_BELOW_CROWN = 1.1;

export function hashSeed(seed) {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function createRandom(seed) {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fract = (x) => x - Math.floor(x);

export const cloudScale = ({ cloudSize }) =>
  cloudSize / (CLOUD_MODEL.halfWidth * 2);

export function rainFootprint(params) {
  const scale = cloudScale(params) * params.rainSpread;
  return {
    radiusX: CLOUD_MODEL.halfWidth * scale,
    radiusZ: CLOUD_MODEL.halfDepth * scale,
  };
}

export const rainFall = ({ cloudHeight }) => cloudHeight + FALL_BELOW_CROWN;

export function shadowHalf(params) {
  const { radiusX, radiusZ } = rainFootprint(params);
  return Math.max(radiusX, radiusZ) * 1.05;
}

// Per drop: column in the unit disk (x, z), cycle phase, speed factor.
export function rainDrops(count, seed) {
  const random = createRandom(`${seed}:rain`);
  const drops = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const r = Math.sqrt(random());
    const a = random() * Math.PI * 2;
    drops.set(
      [r * Math.cos(a), r * Math.sin(a), random(), 0.85 + random() * 0.3],
      i * 4
    );
  }
  return drops;
}

export function dropAt(drops, index, time, params, base) {
  const [u, v, phase, speedScale] = drops.subarray(index * 4, index * 4 + 4);
  const { radiusX, radiusZ } = rainFootprint(params);
  const fall = rainFall(params);
  const speed = params.rainSpeed * speedScale;
  const head =
    base.y - fract(Math.fround((time * speed) / fall) + phase) * fall;
  return {
    head,
    speed,
    x: base.x + u * radiusX,
    z: base.z + v * radiusZ,
  };
}

// Nearest texel, as the shader's textureLoad.
const clampCell = (i, size) => Math.min(size - 1, Math.max(0, i));
const shadowCell = (w, c, { half, size }) =>
  clampCell(Math.floor(((w - c) / half + 1) * 0.5 * size), size);

export function shadowHeight(shadow, x, z) {
  const { centerX, centerZ, heights, size } = shadow;
  return heights[
    shadowCell(z, centerZ, shadow) * size + shadowCell(x, centerX, shadow)
  ];
}

// A step taller than this between texels is a hem or the floor, not slope.
export const SHADOW_EDGE_STEP = 0.04;

// The surface normal under (x, z) from its texel's neighbours, as the
// splash shader takes it.
export function shadowNormal(shadow, x, z) {
  const { centerX, centerZ, half, heights, size } = shadow;
  const ix = shadowCell(x, centerX, shadow);
  const iz = shadowCell(z, centerZ, shadow);
  const at = (i, k) => heights[clampCell(k, size) * size + clampCell(i, size)];
  const h = at(ix, iz);
  const slope = (before, after) => {
    let sum = 0;
    let n = 0;
    if (Math.abs(h - before) < SHADOW_EDGE_STEP) {
      sum += h - before;
      n += 1;
    }
    if (Math.abs(after - h) < SHADOW_EDGE_STEP) {
      sum += after - h;
      n += 1;
    }
    return n ? sum / n / ((2 * half) / size) : 0;
  };
  const sx = slope(at(ix - 1, iz), at(ix + 1, iz));
  const sz = slope(at(ix, iz - 1), at(ix, iz + 1));
  const length = Math.hypot(sx, 1, sz);
  return [-sx / length, 1 / length, -sz / length];
}

export function rainShapes({
  base,
  floorY,
  floorVisible,
  params,
  seed,
  shadow,
  time,
}) {
  const drops = rainDrops(params.rainCount, seed);
  const streaks = [];
  const splashes = [];
  for (let i = 0; i < params.rainCount; i += 1) {
    const { head, speed, x, z } = dropAt(drops, i, time, params, base);
    const stop = shadowHeight(shadow, x, z);
    if (head >= stop) {
      const tail = Math.min(base.y, head + params.rainLength);
      if (tail > head)
        streaks.push([
          [x, head, z],
          [x, tail, z],
        ]);
    } else {
      const age = (stop - head) / speed;
      const onFloor = stop <= floorY + 1e-3;
      if (age < SPLASH_SECONDS && (floorVisible || !onFloor)) {
        const t = age / SPLASH_SECONDS;
        const normal = shadowNormal(shadow, x, z);
        splashes.push({
          center: [
            x + normal[0] * 0.002,
            stop + normal[1] * 0.002,
            z + normal[2] * 0.002,
          ],
          normal,
          radius: params.rainSplash * (0.3 + 0.7 * t) * 0.8,
          strength: 1 - t,
        });
      }
    }
  }
  return { splashes, streaks };
}

// `forcedAt` adds a strike whose main stroke peaks at that second.
const FORCED = -1;
const MAIN_STROKE = 0.35;

export function strikeAt(time, params, seed, forcedAt = null) {
  const {
    lightningDuration: duration,
    lightningMaxGap,
    lightningMinGap,
  } = params;
  if (forcedAt != null) {
    const start = forcedAt - duration * MAIN_STROKE;
    if (time >= start && time < start + duration) {
      return { age: (time - start) / duration, index: FORCED };
    }
  }
  const random = createRandom(`${seed}:strikes`);
  let start = 0;
  for (let index = 0; index < 100000; index += 1) {
    start += lightningMinGap + random() * (lightningMaxGap - lightningMinGap);
    if (time < start) return null;
    if (time < start + duration)
      return { age: (time - start) / duration, index };
    start += duration;
  }
  return null;
}

const bump = (x, centre, width) => {
  const d = Math.abs(x - centre) / width;
  return d >= 1 ? 0 : (1 - d * d) ** 2;
};

// Leader, main return stroke, re-strike.
export const strikeEnvelope = (age) =>
  Math.max(
    0.35 * bump(age, 0.06, 0.06),
    bump(age, MAIN_STROKE, 0.13),
    0.6 * bump(age, 0.68, 0.08)
  );

// In the cloud's frame (base centre at the origin); level 0 is the main bolt.
export function boltPaths(params, seed, strikeIndex) {
  const target = [0, -params.cloudHeight, 0];
  const random = createRandom(`${seed}:bolt:${strikeIndex}`);
  const { radiusX, radiusZ } = rainFootprint(params);
  const a = random() * Math.PI * 2;
  const r = 0.5 * Math.sqrt(random());
  const from = [r * radiusX * Math.cos(a), 0, r * radiusZ * Math.sin(a)];

  const displace = (start, end, depth, jitter) => {
    let points = [start, end];
    let amount = jitter;
    for (let level = 0; level < depth; level += 1) {
      const next = [points[0]];
      for (let i = 1; i < points.length; i += 1) {
        const p = points[i - 1];
        const q = points[i];
        const length = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        next.push(
          [
            (p[0] + q[0]) / 2 + (random() - 0.5) * length * amount,
            (p[1] + q[1]) / 2 + (random() - 0.5) * length * amount * 0.3,
            (p[2] + q[2]) / 2 + (random() - 0.5) * length * amount,
          ],
          q
        );
      }
      points = next;
      amount *= 0.92;
    }
    return points;
  };

  const jitter = params.lightningJitter;
  const main = displace(from, target, 6, jitter);
  const paths = [{ level: 0, points: main }];
  for (let b = 0; b < params.lightningBranches; b += 1) {
    const at = Math.floor((0.15 + random() * 0.55) * (main.length - 1));
    const start = main[at];
    const left = Math.hypot(
      target[0] - start[0],
      target[1] - start[1],
      target[2] - start[2]
    );
    const length = left * (0.25 + random() * 0.3);
    const turn = random() * Math.PI * 2;
    const end = [
      start[0] + Math.cos(turn) * length * 0.7,
      start[1] - length * 0.7,
      start[2] + Math.sin(turn) * length * 0.7,
    ];
    paths.push({ level: 1, points: displace(start, end, 4, jitter) });
  }
  return paths;
}

export function boltShapes({ base, forcedAt, params, seed, time }) {
  if (!params.lightningVisible) return [];
  const strike = strikeAt(time, params, seed, forcedAt);
  if (!strike || strikeEnvelope(strike.age) < 0.2) return [];
  return boltPaths(params, seed, strike.index).map(({ level, points }) => ({
    level,
    points: points.map(([x, y, z]) => [x + base.x, y + base.y, z + base.z]),
  }));
}
