import { TAU, normalize3 } from './math';

// Strange attractors as ODEs, integrated by RK4. `dt`, `warmup` (steps
// dropped before recording) and `duration` (time recorded at length 1) are
// art-directed per system; `axis` is the direction that stands upright on the
// plinth.
export const ATTRACTORS = {
  aizawa: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [a, b, cc, d, e, f] = [c.aizawaA, 0.7, 0.6, c.aizawaD, 0.25, 0.1];
      return ([x, y, z]) => [
        (z - b) * x - d * y,
        d * x + (z - b) * y,
        cc +
          a * z -
          z ** 3 / 3 -
          (x * x + y * y) * (1 + e * z) +
          f * z * x ** 3,
      ];
    },
    dt: 0.01,
    duration: 140,
    start: [0.1, 0, 0],
    warmup: 2000,
  },
  chenLee: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [a, b, d] = [c.chenA, -10, c.chenC];
      return ([x, y, z]) => [a * x - y * z, b * y + x * z, d * z + (x * y) / 3];
    },
    dt: 0.002,
    duration: 60,
    start: [1, 1, 1],
    warmup: 5000,
  },
  dadras: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [a, b, cc, d, e] = [c.dadrasA, c.dadrasB, 1.7, 2, 9];
      return ([x, y, z]) => [
        y - a * x + b * y * z,
        cc * y - x * z + z,
        d * x * y - e * z,
      ];
    },
    dt: 0.005,
    duration: 90,
    start: [1.1, 2.1, -2],
    warmup: 4000,
  },
  fourWing: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [a, b, cc] = [c.fourWingA, 0.01, c.fourWingC];
      return ([x, y, z]) => [a * x + y * z, b * x + cc * y - x * z, -z - x * y];
    },
    dt: 0.01,
    duration: 260,
    start: [1.3, -0.18, 0.01],
    warmup: 2000,
  },
  halvorsen: {
    axis: [1, 1, 1],
    derivative: (c) => {
      const a = c.halvorsenA;
      return ([x, y, z]) => [
        -a * x - 4 * y - 4 * z - y * y,
        -a * y - 4 * z - 4 * x - z * z,
        -a * z - 4 * x - 4 * y - x * x,
      ];
    },
    dt: 0.004,
    duration: 70,
    start: [-1.48, -1.51, 2.04],
    warmup: 2000,
  },
  lorenz: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [s, r, b] = [c.lorenzSigma, c.lorenzRho, c.lorenzBeta];
      return ([x, y, z]) => [s * (y - x), x * (r - z) - y, x * y - b * z];
    },
    dt: 0.004,
    duration: 45,
    start: [0.1, 0, 0],
    warmup: 2000,
  },
  rossler: {
    axis: [0, 0, 1],
    derivative: (c) => {
      const [a, b, cc] = [c.rosslerA, c.rosslerB, c.rosslerC];
      return ([x, y, z]) => [-y - z, x + a * y, b + z * (x - cc)];
    },
    dt: 0.01,
    duration: 260,
    start: [0.1, 0, 0],
    warmup: 3000,
  },
  thomas: {
    axis: [1, 1, 1],
    derivative: (c) => {
      const b = c.thomasB;
      return ([x, y, z]) => [
        Math.sin(y) - b * x,
        Math.sin(z) - b * y,
        Math.sin(x) - b * z,
      ];
    },
    dt: 0.04,
    duration: 900,
    start: [1.1, 1.1, -0.01],
    warmup: 3000,
  },
};

const MAX_STEPS = 400000;

function rk4(f, p, dt) {
  const k1 = f(p);
  const k2 = f(p.map((v, i) => v + (k1[i] * dt) / 2));
  const k3 = f(p.map((v, i) => v + (k2[i] * dt) / 2));
  const k4 = f(p.map((v, i) => v + k3[i] * dt));
  return p.map(
    (v, i) => v + ((k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt) / 6
  );
}

// A rotation taking `axis` to +y (Rodrigues).
function uprightFor(axis) {
  const a = normalize3(axis);
  const v = [-a[2], 0, a[0]];
  const s = Math.hypot(...v);
  const c = a[1];
  if (s < 1e-9) return c > 0 ? (p) => p : ([x, py, z]) => [x, -py, -z];
  const k = v.map((t) => t / s);
  const angle = Math.atan2(s, c);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return (p) => {
    const dot = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
    const cross = [
      k[1] * p[2] - k[2] * p[1],
      k[2] * p[0] - k[0] * p[2],
      k[0] * p[1] - k[1] * p[0],
    ];
    return p.map((t, i) => t * cos + cross[i] * sin + k[i] * dot * (1 - cos));
  };
}

export function attractorPath(config, id) {
  const system = ATTRACTORS[id];
  const f = system.derivative(config);
  const upright = uprightFor(system.axis);
  let p = [...system.start];
  for (let i = 0; i < system.warmup; i += 1) p = rk4(f, p, system.dt);
  const steps = Math.min(
    Math.round((system.duration * config.attractorLength) / system.dt),
    MAX_STEPS
  );
  const points = [];
  for (let i = 0; i < steps; i += 1) {
    p = rk4(f, p, system.dt);
    if (!p.every(Number.isFinite)) break;
    points.push(upright(p));
  }
  return points;
}

// y-up torus: the knot winds p times round the vertical axis and q times
// round the tube. A non-coprime (p, q) is a link of gcd(p, q) knots.
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

export function torusKnot(config, samples) {
  const g = gcd(config.knotP, config.knotQ);
  const p = config.knotP / g;
  const q = config.knotQ / g;
  const r = config.knotRatio;
  return Array.from({ length: g }, (_, k) =>
    Array.from({ length: samples }, (__, i) => {
      const t = (i / samples) * TAU;
      const phi = p * t;
      const theta = q * t + (TAU * k) / (g * p);
      const ring = 1 + r * Math.cos(theta);
      return [ring * Math.cos(phi), r * Math.sin(theta), ring * Math.sin(phi)];
    })
  );
}

export function lissajousKnot(config, samples) {
  const px = config.lissPhaseX * TAU;
  const py = config.lissPhaseY * TAU;
  return [
    Array.from({ length: samples }, (_, i) => {
      const t = (i / samples) * TAU;
      return [
        Math.cos(config.lissNx * t + px),
        Math.cos(config.lissNz * t),
        Math.cos(config.lissNy * t + py),
      ];
    }),
  ];
}

// Fibres of the Hopf map over circles of latitude on the base sphere, each a
// great circle of S³ stereographically projected to a circle in space.
export function hopfFibres(config, samples) {
  const rings = config.hopfRings;
  const spread = config.hopfSpread;
  const twist = (config.hopfTwist * Math.PI) / 180;
  const fibres = [];
  for (let k = 0; k < rings; k += 1) {
    const f = rings === 1 ? 0.5 : k / (rings - 1);
    const theta = (Math.PI / 2) * (1 - spread) + Math.PI * spread * f;
    const a = Math.cos(theta / 2);
    const b = Math.sin(theta / 2);
    for (let j = 0; j < config.hopfFibers; j += 1) {
      const phi = (TAU * (j + (k % 2) * 0.5)) / config.hopfFibers + twist;
      fibres.push({
        points: Array.from({ length: samples }, (_, i) => {
          const t = (i / samples) * TAU;
          const x1 = a * Math.cos(t + phi);
          const y1 = a * Math.sin(t + phi);
          const x2 = b * Math.cos(t);
          const w = b * Math.sin(t);
          const k1 = 1 / Math.max(1 - w, 1e-3);
          return [x1 * k1, x2 * k1, y1 * k1];
        }),
        ring: rings === 1 ? 0 : k / (rings - 1),
      });
    }
  }
  return fibres;
}
