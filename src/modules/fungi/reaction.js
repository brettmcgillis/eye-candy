/* eslint-disable no-param-reassign */
const TAU = Math.PI * 2;
const DU = 1;
const DV = 0.5;

// Karl Sims' Gray-Scott on a disc: U=1 outside the disc so a growing pattern
// stays round instead of finding the grid's corners.
function createField(n, feed, kill, rng, noise, seeds, jitter = 0) {
  const u = new Float32Array(n * n).fill(1);
  const v = new Float32Array(n * n);
  const nu = new Float32Array(n * n);
  const nv = new Float32Array(n * n);
  const inside = new Uint8Array(n * n);
  const c = (n - 1) / 2;
  const limit = c * 0.96;

  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      inside[j * n + i] = Math.hypot(i - c, j - c) < limit ? 1 : 0;
    }
  }

  seeds.forEach(({ radius, x, y }) => {
    const r = radius * n;

    for (let j = 0; j < n; j += 1) {
      for (let i = 0; i < n; i += 1) {
        const dx = i - x * (n - 1);
        const dy = j - y * (n - 1);
        const a = Math.atan2(dy, dx);
        const edge = r * (1 + 0.35 * noise.noise1(a * 1.3 + x * 9, 3));

        if (Math.hypot(dx, dy) < edge && (!jitter || rng() < 0.5)) {
          u[j * n + i] = 0.5 + rng.signed() * 0.05;
          v[j * n + i] = 0.25 + rng.signed() * 0.05;
        }
      }
    }
  });

  function step(count) {
    let a = u;
    let b = v;
    let a2 = nu;
    let b2 = nv;

    for (let it = 0; it < count; it += 1) {
      for (let j = 1; j < n - 1; j += 1) {
        const row = j * n;

        for (let i = 1; i < n - 1; i += 1) {
          const k = row + i;

          if (!inside[k]) {
            a2[k] = 1;
            b2[k] = 0;
            continue; // eslint-disable-line no-continue
          }
          const lu =
            0.2 * (a[k - 1] + a[k + 1] + a[k - n] + a[k + n]) +
            0.05 * (a[k - n - 1] + a[k - n + 1] + a[k + n - 1] + a[k + n + 1]) -
            a[k];
          const lv =
            0.2 * (b[k - 1] + b[k + 1] + b[k - n] + b[k + n]) +
            0.05 * (b[k - n - 1] + b[k - n + 1] + b[k + n - 1] + b[k + n + 1]) -
            b[k];
          const uvv = a[k] * b[k] * b[k];

          a2[k] = a[k] + DU * lu - uvv + feed * (1 - a[k]);
          b2[k] = b[k] + DV * lv + uvv - (kill + feed) * b[k];
        }
      }
      [a, a2] = [a2, a];
      [b, b2] = [b2, b];
      if (jitter && it % 20 === 19) {
        for (let k = 0; k < n * n; k += 1) {
          if (b[k] > 0.02) b[k] += (rng() - 0.5) * jitter;
        }
      }
    }
    if (a !== u) {
      u.set(a);
      v.set(b);
    }
  }

  return { inside, step, u, v };
}

function thallusSeeds(rng) {
  const count = 3 + Math.floor(rng() * 5);

  return Array.from({ length: count }, (_, k) => {
    const a = rng() * TAU;
    const d = k === 0 ? 0 : rng.range(0.07, 0.26);

    return {
      radius: rng.range(0.015, 0.035),
      x: 0.5 + Math.cos(a) * d,
      y: 0.5 + Math.sin(a) * d,
    };
  });
}

function bilinear(grid, n, x, y) {
  const xi = Math.min(n - 2, Math.max(0, Math.floor(x)));
  const yi = Math.min(n - 2, Math.max(0, Math.floor(y)));
  const fx = Math.min(1, Math.max(0, x - xi));
  const fy = Math.min(1, Math.max(0, y - yi));
  const a = grid[yi * n + xi];
  const b = grid[yi * n + xi + 1];
  const c = grid[(yi + 1) * n + xi];
  const d = grid[(yi + 1) * n + xi + 1];

  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));

  return t * t * (3 - 2 * t);
};

function vanDerCorput(k) {
  let n = k;
  let q = 0;
  let bk = 0.5;

  while (n > 0) {
    q += (n % 2) * bk;
    n = Math.floor(n / 2);
    bk /= 2;
  }

  return q;
}

// One tier of the bloom: a ruffled, deeply lobed cup whose top is a stack of
// thin layers, each ending in a step. The steps run along contours of radius
// bent by the reaction-diffusion maze, so the terraces zig-zag like the
// references' stacked sheets.
function bloomTier(r, tier, field, n, noise) {
  const { lobePhase, R, spin, y0 } = tier;
  const K = Math.max(6, Math.round(r.terraces));
  const stepH = r.step * R;
  const sIn = tier.top ? 0.015 : Math.min(0.4, (r.stalkRadius * 1.1) / R);
  const margin = (theta) =>
    R *
    (1 +
      r.lobeAmp *
        noise.noise1(Math.cos(theta) * r.lobeCount * 0.5 + lobePhase, 9) +
      r.lobeAmp * 0.35 * Math.sin(theta * r.lobeCount + lobePhase));
  const V = (s, theta) => {
    const a = theta + spin;
    const x = (n - 1) / 2 + Math.cos(a) * s * 0.46 * n;
    const y = (n - 1) / 2 + Math.sin(a) * s * 0.46 * n;

    return Math.min(1, Math.max(0, bilinear(field.v, n, x, y) / 0.3));
  };
  const T = (s, theta) => K * s + r.maze * K * 0.08 * (V(s, theta) - 0.5);
  const stair = (t) => {
    const f = Math.floor(t);

    return f + smooth(0.72, 1, t - f);
  };

  function at(s, theta, under = false, out = [0, 0, 0]) {
    const rad = margin(theta) * s;
    const t = T(s, theta);
    const terrace = under
      ? 0
      : stepH * (K - stair(t)) * smooth(sIn, sIn + 0.1, s);
    const y =
      y0 -
      r.droop * R * s ** 1.5 +
      r.ruffle * R * s ** 3 * Math.sin(theta * r.ruffleCount + lobePhase) +
      terrace -
      (under ? r.thickness * R * (1 - 0.5 * s) : 0);

    out[0] = Math.cos(theta) * rad;
    out[1] = y;
    out[2] = Math.sin(theta) * rad;

    return out;
  }

  return { K, T, at, sIn, stepH };
}

function buildBloomTier(e, r, rng, surf, tier, detail) {
  const { R } = tier;
  const count = Math.round((r.fibers * detail * R) / 2.5);
  const width = ((Math.PI * 2 * R) / count) * 0.5;
  const p = [0, 0, 0];
  const colorBase = 0.45 + 0.1 * tier.rank;

  [false, true].forEach((under) => {
    const layerCount = under ? Math.round(count * 0.55) : count;

    for (let k = 0; k < layerCount; k += 1) {
      const theta0 = TAU * vanDerCorput(k + 1) + rng.signed() * 0.002;
      const s0 = Math.max(surf.sIn, ((k + 1) / layerCount) * 0.98);
      const steps = Math.max(
        6,
        Math.ceil((1 - s0) * (under ? 40 : surf.K * 7))
      );
      const pts = [];
      const tint = [];
      const ups = [];

      for (let i = 0; i <= steps; i += 1) {
        const s = s0 + ((1 - s0) * i) / steps;
        const theta = theta0 + 0.02 * Math.sin(s * 9 + k);

        surf.at(s, theta, under, p);
        pts.push(p[0], p[1], p[2]);
        ups.push([-Math.sin(theta), 0, Math.cos(theta)]);
        if (under) {
          tint.push(0.25 + 0.3 * s);
        } else {
          const t = surf.T(s, theta);
          const edge = smooth(0.6, 0.97, t - Math.floor(t));

          tint.push(Math.min(1, colorBase + 0.3 * s + 0.3 * edge));
        }
      }
      e.fiber(pts, {
        aspect: under ? 1.8 : 3,
        born: (i, t) =>
          0.2 + 0.7 * (s0 + (1 - s0) * t) * (0.6 + 0.4 * tier.rank),
        color: (i) => tint[i],
        glow: under ? 0 : 0.5,
        occlusion: (i, t) => (under ? 0.6 : 0.7 + 0.3 * t),
        rand: rng(),
        radius: width,
        sag: (i, t) => R * (s0 + (1 - s0) * t) ** 2 * 0.3,
        shade: 0.9 + rng() * 0.2,
        up: (i) => ups[i],
      });
    }
  });

  const rim = [];

  for (let i = 0; i <= 360; i += 1) {
    const theta = (TAU * i) / 360;

    surf.at(1, theta, false, p);
    const q = surf.at(1, theta, true);

    rim.push((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
  }
  e.fiber(rim, {
    born0: 0.85,
    born1: 0.95,
    color: 1,
    rand: rng(),
    radius: R * (r.thickness * 0.6 + 0.012),
    sag: R * 0.3,
  });
}

// bloom: a rosette of stacked, ruffled cups on a short stout stalk. The tiers
// shrink as they climb and each is lifted clear of the one below by its own
// terraces and ruffle, so no two ever touch.
function buildBloom(e, r, rng, field, n, noise, detail) {
  const tiers = Math.max(1, Math.round(r.tiers));
  const list = [];
  const y0 = r.stalk;

  for (let k = 0; k < tiers; k += 1) {
    const R = r.radius * r.tierShrink ** k;
    const tier = {
      R,
      lobePhase: rng() * TAU,
      rank: tiers > 1 ? k / (tiers - 1) : 1,
      spin: rng() * TAU,
      y0,
    };

    if (k > 0) {
      const below = list[k - 1];
      const lower = bloomTier(r, below, field, n, noise);
      const upper = bloomTier(r, { ...tier, y0: 0 }, field, n, noise);
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      let lift = -Infinity;

      for (let j = 0; j <= 30; j += 1) {
        for (let i = 0; i < 96; i += 1) {
          const theta = (TAU * i) / 96;
          const s1 = j / 30;

          upper.at(s1, theta, true, b);
          lower.at(1, theta, false, a);
          const s0 = Math.min(
            1,
            Math.hypot(b[0], b[2]) / Math.hypot(a[0], a[2])
          );

          lower.at(s0, theta, false, a);
          lift = Math.max(lift, a[1] - b[1]);
        }
      }
      tier.y0 = lift + r.thickness * R + 0.03 * r.radius;
    }
    list.push(tier);
  }
  list[list.length - 1].top = true;

  const stalkTop = list[list.length - 1].y0;
  const stalkFibers = Math.round(90 * detail);
  const p = [0, 0, 0];
  const stalkWidth = ((Math.PI * r.stalkRadius) / stalkFibers) * 1.5;

  for (let j = 0; j < stalkFibers; j += 1) {
    const phi0 = (TAU * j) / stalkFibers;
    const pts = [];

    for (let k = 0; k <= 24; k += 1) {
      const v = k / 24;
      const rad =
        r.stalkRadius *
        (1 + 0.6 * Math.exp(-((v / 0.12) ** 2))) *
        (1 + noise.noise2(phi0 * 2, v * 4) * 0.06);
      const phi = phi0 + noise.noise1(v * 2 + j, 4) * 0.05;

      p[0] = Math.cos(phi) * rad;
      p[1] = stalkTop * v;
      p[2] = Math.sin(phi) * rad;
      pts.push(p[0], p[1], p[2]);
    }
    e.fiber(pts, {
      born0: 0,
      born1: 0.3,
      color: (i, t) => 0.02 + 0.2 * t,
      rand: rng(),
      radius: stalkWidth,
      shade: 0.9 + rng() * 0.2,
    });
  }

  list.forEach((tier) => {
    const surf = bloomTier(r, tier, field, n, noise);

    buildBloomTier(e, r, rng, surf, tier, detail);
  });

  const last = list[list.length - 1];

  return last.y0 + r.terraces * r.step * last.R;
}

function arrivalField(field, n, r) {
  const limit = r.levels * r.steps * 3;
  const arrival = new Float32Array(n * n).fill(Infinity);
  const chunk = Math.max(10, Math.round(r.steps / 2));
  const mid = (n - 1) / 2;
  let total = 0;

  for (let it = 0; it < limit; it += chunk) {
    field.step(chunk);
    total = it + chunk;
    let reach = 0;

    for (let j = 0; j < n; j += 1) {
      for (let i = 0; i < n; i += 1) {
        const k = j * n + i;

        if (field.v[k] > 0.18) {
          if (arrival[k] === Infinity) arrival[k] = it;
          reach = Math.max(reach, Math.hypot(i - mid, j - mid));
        }
      }
    }
    if (reach > mid * 0.82) break;
  }
  for (let k = 0; k < n * n; k += 1) {
    arrival[k] = arrival[k] === Infinity ? 1.4 : arrival[k] / total;
  }

  const tmp = new Float32Array(n * n);

  for (let pass = 0; pass < 5; pass += 1) {
    for (let j = 1; j < n - 1; j += 1) {
      for (let i = 1; i < n - 1; i += 1) {
        const k = j * n + i;

        tmp[k] =
          (arrival[k] * 4 +
            arrival[k - 1] +
            arrival[k + 1] +
            arrival[k - n] +
            arrival[k + n]) /
          8;
      }
    }
    arrival.set(tmp);
  }

  return arrival;
}

// terrace: a lichen / turkey-tail thallus. Hyphae run in the direction the
// colony grew, so the fibres are evenly spaced streamlines (Jobard & Lefer)
// of the growth front's arrival-time gradient; zones and raised rims come
// from arrival time, and the live pattern ridges the surface.
function buildThallus(e, r, rng, field, n) {
  const arrival = arrivalField(field, n, r);
  const cellWorld = r.domain / n;
  const c = (n - 1) / 2;
  const rings = Math.max(1, r.rings);
  const dsep = 0.6;
  const dtest = dsep * 0.55;
  const step = 0.35;
  const occupancy = new Map();
  const key = (x, y) => `${Math.floor(x / dsep)},${Math.floor(y / dsep)}`;
  const A = (x, y) => bilinear(arrival, n, x, y);
  const grad = (x, y) => [
    A(x + 0.5, y) - A(x - 0.5, y),
    A(x, y + 0.5) - A(x, y - 0.5),
  ];
  const heightAt = (a, x, y) =>
    r.height *
    (0.35 * (1 - a) +
      0.45 * Math.sin(Math.PI * a * rings) ** 6 * (1 - a) ** 0.4 +
      0.2 * bilinear(field.v, n, x, y));
  const clear = (x, y, d, line) => {
    const cx = Math.floor(x / dsep);
    const cy = Math.floor(y / dsep);

    for (let i = cx - 1; i <= cx + 1; i += 1) {
      for (let j = cy - 1; j <= cy + 1; j += 1) {
        const list = occupancy.get(`${i},${j}`);

        if (list) {
          for (let q = 0; q < list.length; q += 1) {
            const [px, py, id] = list[q];

            if (id !== line && Math.hypot(px - x, py - y) < d) return false;
          }
        }
      }
    }

    return true;
  };
  const inside = (x, y) =>
    x > 1 && y > 1 && x < n - 2 && y < n - 2 && A(x, y) < 0.985;

  function trace(x0, y0, line) {
    const half = (sign) => {
      const pts = [];
      let x = x0;
      let y = y0;

      for (let k = 0; k < 800; k += 1) {
        const [gx, gy] = grad(x, y);
        const gl = Math.hypot(gx, gy);

        if (gl < 1e-5) break;
        const nx = x + (sign * gx * step) / gl;
        const ny = y + (sign * gy * step) / gl;

        if (!inside(nx, ny) || !clear(nx, ny, dtest, line)) break;
        if (sign < 0 && A(nx, ny) < 0.004) break;
        x = nx;
        y = ny;
        pts.push([x, y]);
      }

      return pts;
    };

    return [...half(-1).reverse(), [x0, y0], ...half(1)];
  }

  const lines = [];
  const queue = [];

  function addLine(x, y) {
    if (!inside(x, y) || !clear(x, y, dsep, -1)) return;
    const id = lines.length;
    const pts = trace(x, y, id);

    if (pts.length < 6) return;
    pts.forEach(([px, py]) => {
      const k = key(px, py);

      if (!occupancy.has(k)) occupancy.set(k, []);
      occupancy.get(k).push([px, py, id]);
    });
    lines.push(pts);
    queue.push(id);
  }

  for (let gy = 2; gy < n - 2; gy += 4) {
    for (let gx = 2; gx < n - 2; gx += 4) {
      addLine(gx + rng(), gy + rng());
      while (queue.length > 0) {
        const pts = lines[queue.shift()];

        for (let k = 0; k < pts.length; k += 2) {
          const [x, y] = pts[k];
          const [nx, ny] = pts[Math.min(pts.length - 1, k + 1)];
          const [px, py] = pts[Math.max(0, k - 1)];
          const tx = nx - px;
          const ty = ny - py;
          const tl = Math.hypot(tx, ty) || 1;

          addLine(x - (ty / tl) * dsep, y + (tx / tl) * dsep);
          addLine(x + (ty / tl) * dsep, y - (tx / tl) * dsep);
        }
      }
    }
  }

  const radius = dsep * cellWorld * 0.62;

  lines.forEach((pts) => {
    const out = [];
    const as = [];

    pts.forEach(([x, y], k) => {
      if (k % 3 && k !== pts.length - 1) return;
      const a = Math.min(1, A(x, y));

      as.push(a);
      out.push((x - c) * cellWorld, heightAt(a, x, y), (y - c) * cellWorld);
    });
    if (out.length < 6) return;
    e.fiber(out, {
      born: (k) => 0.04 + 0.92 * as[k],
      color: (k) =>
        0.1 +
        0.6 * as[k] +
        0.3 * Math.sin(Math.PI * as[k] * rings * 1.5) ** 2 * (1 - as[k] * 0.5),
      glow: 0.5,
      occlusion: (k) => 0.55 + 0.45 * Math.sin(Math.PI * as[k] * rings) ** 2,
      rand: rng(),
      radius: (k) => radius * (1 - 0.4 * as[k] ** 4),
      sag: (k) => r.height * as[k] * 0.4,
      shade: 0.9 + rng() * 0.2,
    });
  });
}

// The reaction plan: a Gray-Scott field is the specimen's growth — the maze
// a bloom's terraces follow, or the spreading front a lichen thallus traces.
export default function buildReaction(e, g, rng, noise, detail = 1) {
  const r = g.reaction;
  const n = Math.max(64, Math.min(200, r.grid));

  if (r.mode === 'bloom') {
    const field = createField(
      n,
      r.feed,
      r.kill,
      rng,
      noise,
      [{ radius: 0.47, x: 0.5, y: 0.5 }],
      0.02
    );

    field.step(Math.round(r.iterations));

    return { height: buildBloom(e, r, rng, field, n, noise, detail) };
  }

  const pairs = [
    [r.feed, r.kill],
    [0.0545, 0.062],
    [0.046, 0.063],
  ];

  for (let attempt = 0; attempt < pairs.length; attempt += 1) {
    const [feed, kill] = pairs[attempt];
    const field = createField(n, feed, kill, rng, noise, thallusSeeds(rng), 0);

    field.step(60);
    let alive = 0;

    for (let k = 0; k < n * n; k += 1) alive += field.v[k] > 0.2 ? 1 : 0;
    if (alive > 4) {
      buildThallus(e, r, rng, field, n);

      return { height: r.height };
    }
  }

  return { height: r.height };
}
