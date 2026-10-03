const TAU = Math.PI * 2;
const NO_CHAIN = -1;

// Every generator fills a roughly unit-radius local frame and emits points in
// order; consecutive points that share a chain id are the generator's own
// path (a curve, a trajectory, an arm) for the chain rule to link.
function emitter() {
  const points = [];
  const chains = [];
  return {
    chains,
    points,
    push(p, chain = NO_CHAIN) {
      points.push(p);
      chains.push(chain);
    },
  };
}

function onSphere(rng) {
  const z = rng() * 2 - 1;
  const a = rng() * TAU;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}

function normalizeTo(points, radius = 1) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  points.forEach((p) =>
    p.forEach((v, a) => {
      lo[a] = Math.min(lo[a], v);
      hi[a] = Math.max(hi[a], v);
    })
  );
  const center = lo.map((v, a) => (v + hi[a]) / 2);
  const span = Math.max(...hi.map((v, a) => v - lo[a]), 1e-6) / 2;
  return points.map((p) => p.map((v, a) => ((v - center[a]) / span) * radius));
}

const PRIMITIVES = {
  ring(rng, n) {
    const out = emitter();
    const thin = rng.range(0.55, 0.9);
    const angles = Array.from({ length: n }, () => rng() * TAU).sort(
      (a, b) => a - b
    );
    angles.forEach((t) => {
      const r = thin + rng() * (1 - thin);
      out.push([Math.cos(t) * r, (rng() - 0.5) * 0.08, Math.sin(t) * r], 0);
    });
    return out;
  },

  sphere(rng, n) {
    const out = emitter();
    for (let i = 0; i < n; i += 1) out.push(onSphere(rng));
    return out;
  },

  torus(rng, n) {
    const out = emitter();
    const R = rng.range(0.6, 0.75);
    const r = 1 - R;
    for (let i = 0; i < n; i += 1) {
      const u = rng() * TAU;
      const v = rng() * TAU;
      out.push([
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u),
      ]);
    }
    return out;
  },

  helix(rng, n) {
    const out = emitter();
    const strands = rng.chance(0.5) ? 2 : 1;
    const turns = rng.range(1.5, 4.5);
    const radius = rng.range(0.35, 0.6);
    const per = Math.ceil(n / strands);
    for (let s = 0; s < strands; s += 1) {
      for (let i = 0; i < per; i += 1) {
        const t = i / Math.max(per - 1, 1);
        const a = t * turns * TAU + (s * TAU) / strands;
        out.push([Math.cos(a) * radius, t * 2 - 1, Math.sin(a) * radius], s);
      }
    }
    return out;
  },

  knot(rng, n) {
    const out = emitter();
    const [p, q] = [
      [2, 3],
      [3, 5],
      [2, 5],
      [3, 7],
      [5, 8],
    ][Math.floor(rng() * 5)];
    const raw = [];
    for (let i = 0; i < n; i += 1) {
      const t = (i / n) * TAU;
      const r = Math.cos(q * t) + 2;
      raw.push([r * Math.cos(p * t), -Math.sin(q * t), r * Math.sin(p * t)]);
    }
    normalizeTo(raw).forEach((point) => out.push(point, 0));
    return out;
  },

  lissajous(rng, n) {
    const out = emitter();
    const freq = () => 1 + Math.floor(rng() * 5);
    const [a, b, c] = [freq(), freq(), freq()];
    const phase = [rng() * TAU, rng() * TAU, rng() * TAU];
    for (let i = 0; i < n; i += 1) {
      const t = (i / n) * TAU;
      out.push(
        [
          Math.sin(a * t + phase[0]),
          Math.sin(b * t + phase[1]),
          Math.sin(c * t + phase[2]),
        ],
        0
      );
    }
    return out;
  },

  lattice(rng, n) {
    const out = emitter();
    const side = Math.max(2, Math.round(Math.cbrt(n)));
    const flat = rng.chance(0.35);
    const layers = flat ? 1 : side;
    const across = flat ? Math.max(2, Math.round(Math.sqrt(n))) : side;
    let row = 0;
    for (let z = 0; z < layers; z += 1) {
      for (let y = 0; y < across; y += 1) {
        for (let x = 0; x < across; x += 1) {
          const at = (v, m) => (m > 1 ? (v / (m - 1)) * 2 - 1 : 0);
          out.push([at(x, across), at(y, across), at(z, layers)], row);
        }
        row += 1;
      }
    }
    return out;
  },

  phyllotaxis(rng, n) {
    const out = emitter();
    const golden = Math.PI * (3 - Math.sqrt(5));
    const sphere = rng.chance(0.5);
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const a = i * golden;
      if (sphere) {
        const y = 1 - 2 * t;
        const r = Math.sqrt(1 - y * y);
        out.push([Math.cos(a) * r, y, Math.sin(a) * r], 0);
      } else {
        const r = Math.sqrt(t);
        out.push([Math.cos(a) * r, (rng() - 0.5) * 0.05, Math.sin(a) * r], 0);
      }
    }
    return out;
  },
};

const NOISE = {
  blob(rng, n, noise) {
    const out = emitter();
    const scale = rng.range(1.2, 2.6);
    const offset = [rng() * 50, rng() * 50, rng() * 50];
    const threshold = rng.range(-0.02, 0.12);
    for (let tries = 0; out.points.length < n && tries < n * 60; tries += 1) {
      const p = [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1];
      const falloff = Math.hypot(...p) * 0.35;
      const v = noise.fbm(
        p[0] * scale + offset[0],
        p[1] * scale + offset[1],
        p[2] * scale + offset[2]
      );
      if (v - falloff > threshold - 0.2) out.push(p);
    }
    return out;
  },

  filament(rng, n, noise) {
    const out = emitter();
    const scale = rng.range(1, 2.2);
    const offset = [rng() * 50, rng() * 50, rng() * 50];
    const width = rng.range(0.025, 0.06);
    for (let tries = 0; out.points.length < n && tries < n * 80; tries += 1) {
      const p = [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1];
      if (Math.hypot(...p) <= 1) {
        const v = noise.fbm(
          p[0] * scale + offset[0],
          p[1] * scale + offset[1],
          p[2] * scale + offset[2],
          3
        );
        if (Math.abs(v) < width) out.push(p);
      }
    }
    return out;
  },

  shell(rng, n, noise) {
    const out = emitter();
    const scale = rng.range(1, 3);
    const depth = rng.range(0.2, 0.5);
    for (let i = 0; i < n; i += 1) {
      const d = onSphere(rng);
      const r =
        1 - depth + depth * noise.fbm(d[0] * scale, d[1] * scale, d[2] * scale);
      out.push(d.map((v) => v * r));
    }
    return out;
  },
};

// Integrated trajectories, sampled every few steps once the transient dies.
function trajectory(rng, n, step, start, dt, every = 3) {
  const raw = [];
  let p = start.map((v) => v + (rng() - 0.5) * 0.1);
  for (let i = 0; i < 400; i += 1) p = step(p, dt);
  for (let i = 0; raw.length < n; i += 1) {
    p = step(p, dt);
    if (i % every === 0) raw.push(p);
  }
  const out = emitter();
  normalizeTo(raw).forEach((point) => out.push(point, 0));
  return out;
}

const rk2 = (field) => (p, dt) => {
  const k1 = field(p);
  const mid = p.map((v, a) => v + k1[a] * dt * 0.5);
  const k2 = field(mid);
  return p.map((v, a) => v + k2[a] * dt);
};

const ATTRACTORS = {
  lorenz: (rng, n) =>
    trajectory(
      rng,
      n,
      rk2(([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z]),
      [0.1, 0, 20],
      0.006,
      2
    ),

  aizawa: (rng, n) =>
    trajectory(
      rng,
      n,
      rk2(([x, y, z]) => [
        (z - 0.7) * x - 3.5 * y,
        3.5 * x + (z - 0.7) * y,
        0.6 +
          0.95 * z -
          z ** 3 / 3 -
          (x * x + y * y) * (1 + 0.25 * z) +
          0.1 * z * x ** 3,
      ]),
      [0.1, 0, 0],
      0.01,
      2
    ),

  thomas: (rng, n) =>
    trajectory(
      rng,
      n,
      rk2(([x, y, z]) => [
        Math.sin(y) - 0.208186 * x,
        Math.sin(z) - 0.208186 * y,
        Math.sin(x) - 0.208186 * z,
      ]),
      [1.1, 1.1, -0.01],
      0.08,
      2
    ),

  halvorsen: (rng, n) =>
    trajectory(
      rng,
      n,
      rk2(([x, y, z]) => [
        -1.89 * x - 4 * y - 4 * z - y * y,
        -1.89 * y - 4 * z - 4 * x - z * z,
        -1.89 * z - 4 * x - 4 * y - x * x,
      ]),
      [-1.48, -1.51, 2.04],
      0.004,
      2
    ),

  flow(rng, n, noise) {
    const out = emitter();
    const lines = 6 + Math.floor(rng() * 10);
    const per = Math.ceil(n / lines);
    const scale = rng.range(0.8, 1.6);
    const step = 0.035;
    for (let l = 0; l < lines; l += 1) {
      let p = [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1].map((v) => v * 0.8);
      for (let i = 0; i < per; i += 1) {
        out.push(p, l);
        const v = noise.curl(p[0] * scale, p[1] * scale, p[2] * scale);
        const len = Math.hypot(...v) || 1;
        p = p.map((c, a) => c + (v[a] / len) * step);
        if (Math.hypot(...p) > 1.2) break;
      }
    }
    return out;
  },
};

const CLUSTERS = {
  gaussian(rng, n) {
    const out = emitter();
    const clumps = Array.from({ length: 3 + Math.floor(rng() * 5) }, () => ({
      center: onSphere(rng).map((v) => v * rng.range(0, 0.7)),
      sigma: rng.range(0.08, 0.25),
      weight: rng.range(0.3, 1),
    }));
    const total = clumps.reduce((sum, c) => sum + c.weight, 0);
    clumps.forEach((clump) => {
      const share = Math.round((clump.weight / total) * n);
      for (let i = 0; i < share; i += 1) {
        out.push(clump.center.map((v) => v + rng.gauss() * clump.sigma));
      }
    });
    return out;
  },

  hub(rng, n) {
    const out = emitter();
    const spokes = 5 + Math.floor(rng() * 14);
    const per = Math.max(2, Math.floor(n / spokes));
    for (let s = 0; s < spokes; s += 1) {
      const dir = onSphere(rng);
      const reach = rng.range(0.4, 1);
      const bend = onSphere(rng).map((v) => v * rng.range(0, 0.3));
      for (let i = 0; i < per; i += 1) {
        const t = i / per;
        out.push(
          dir.map((v, a) => v * t * reach + bend[a] * t * t),
          s
        );
      }
    }
    return out;
  },

  galaxy(rng, n) {
    const out = emitter();
    const arms = 2 + Math.floor(rng() * 4);
    const twist = rng.range(2, 5);
    const per = Math.ceil(n / arms);
    for (let arm = 0; arm < arms; arm += 1) {
      for (let i = 0; i < per; i += 1) {
        const t = i / per;
        const a = (arm / arms) * TAU + t * twist;
        const scatter = 0.04 + t * 0.08;
        out.push(
          [
            Math.cos(a) * t + rng.gauss() * scatter,
            rng.gauss() * 0.03 * (1 - t),
            Math.sin(a) * t + rng.gauss() * scatter,
          ],
          arm
        );
      }
    }
    return out;
  },
};

export const GENERATORS = {
  attractor: ATTRACTORS,
  cluster: CLUSTERS,
  noise: NOISE,
  primitive: PRIMITIVES,
};

export { NO_CHAIN };
