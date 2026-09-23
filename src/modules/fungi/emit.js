/* eslint-disable no-param-reassign */
export const MAX_SEGMENTS = 480000;
const MAX_BEADS = 60000;
const SEGMENT_KEYS = [
  'start',
  'end',
  'frameStart',
  'frameEnd',
  'time',
  'tone',
  'meta',
];
const BEAD_KEYS = ['position', 'info', 'extra'];

export const BEAD_KIND = { bead: 0, held: 2, spore: 1 };

function octEncode(x, y, z, out, offset) {
  const s = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
  let u = x / s;
  let v = y / s;

  if (z < 0) {
    const ou = u;

    u = (1 - Math.abs(v)) * (ou >= 0 ? 1 : -1);
    v = (1 - Math.abs(ou)) * (v >= 0 ? 1 : -1);
  }

  out[offset] = u;
  out[offset + 1] = v;
}

function perpendicular(tx, ty, tz) {
  const ax = Math.abs(tx) < 0.9 ? 1 : 0;
  const ay = ax ? 0 : 1;
  let nx = ay * tz;
  let ny = -ax * tz;
  let nz = ax * ty - ay * tx;
  const l = Math.hypot(nx, ny, nz) || 1;

  nx /= l;
  ny /= l;
  nz /= l;

  return [nx, ny, nz];
}

function grow(store, keys, needed) {
  if (needed <= store.capacity) return;
  let { capacity } = store;

  while (capacity < needed) capacity *= 2;
  keys.forEach((key) => {
    const next = new Float32Array(capacity * 4);

    next.set(store[key]);
    store[key] = next;
  });
  store.capacity = capacity;
}

function createStore(keys, capacity) {
  const store = { capacity, count: 0 };

  keys.forEach((key) => {
    store[key] = new Float32Array(capacity * 4);
  });

  return store;
}

const value = (v, i, t) => (typeof v === 'function' ? v(i, t) : v);

const IDENTITY = { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], s: 1, t: [0, 0, 0] };

// Every fibre, plate and bead of a specimen, in the tube layout
// @modules/fungiRender draws. Fibres are polylines; each point's frame is
// rotation-minimising unless the caller pins its wide axis (`up`), which is
// what turns a tube into a gill plate.
export default function createEmitter({ maxSegments = MAX_SEGMENTS } = {}) {
  const segments = createStore(SEGMENT_KEYS, 16384);
  const beads = createStore(BEAD_KEYS, 1024);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let xf = IDENTITY;
  let delay = 0;
  let truncated = false;

  const pt = new Float64Array(3);

  function place(x, y, z) {
    const { m, s, t } = xf;

    pt[0] = (m[0] * x + m[1] * y + m[2] * z) * s + t[0];
    pt[1] = (m[3] * x + m[4] * y + m[5] * z) * s + t[1];
    pt[2] = (m[6] * x + m[7] * y + m[8] * z) * s + t[2];

    return pt;
  }

  function turn(x, y, z) {
    const { m } = xf;

    return [
      m[0] * x + m[1] * y + m[2] * z,
      m[3] * x + m[4] * y + m[5] * z,
      m[6] * x + m[7] * y + m[8] * z,
    ];
  }

  function include(p, r) {
    for (let a = 0; a < 3; a += 1) {
      if (p[a] - r < min[a]) min[a] = p[a] - r;
      if (p[a] + r > max[a]) max[a] = p[a] + r;
    }
  }

  // `points` is flat xyz in the current transform's local space. Options may
  // be numbers or `(i, t) => value` where `t` is arc-length 0..1.
  function fiber(points, opts = {}) {
    const n = Math.floor(points.length / 3);

    if (n < 2) return;
    if (segments.count + n - 1 > maxSegments) {
      truncated = true;

      return;
    }

    const world = new Float64Array(n * 3);
    const arc = new Float64Array(n);

    for (let i = 0; i < n; i += 1) {
      const p = place(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);

      world.set(p, i * 3);
      if (i > 0) {
        arc[i] =
          arc[i - 1] +
          Math.hypot(
            p[0] - world[i * 3 - 3],
            p[1] - world[i * 3 - 2],
            p[2] - world[i * 3 - 1]
          );
      }
    }

    const total = arc[n - 1] || 1;
    const tangent = new Float64Array(n * 3);
    const normal = new Float64Array(n * 3);

    for (let i = 0; i < n; i += 1) {
      const a = Math.max(0, i - 1);
      const b = Math.min(n - 1, i + 1);
      let tx = world[b * 3] - world[a * 3];
      let ty = world[b * 3 + 1] - world[a * 3 + 1];
      let tz = world[b * 3 + 2] - world[a * 3 + 2];
      const l = Math.hypot(tx, ty, tz) || 1;

      tx /= l;
      ty /= l;
      tz /= l;
      tangent[i * 3] = tx;
      tangent[i * 3 + 1] = ty;
      tangent[i * 3 + 2] = tz;

      let nx;
      let ny;
      let nz;

      if (opts.up) {
        const u = value(opts.up, i, arc[i] / total);

        [nx, ny, nz] = turn(u[0], u[1], u[2]);
      } else if (i > 0) {
        nx = normal[i * 3 - 3];
        ny = normal[i * 3 - 2];
        nz = normal[i * 3 - 1];
      } else {
        [nx, ny, nz] = perpendicular(tx, ty, tz);
      }

      const d = nx * tx + ny * ty + nz * tz;

      nx -= tx * d;
      ny -= ty * d;
      nz -= tz * d;
      const nl = Math.hypot(nx, ny, nz);

      if (nl < 1e-5) {
        [nx, ny, nz] = perpendicular(tx, ty, tz);
      } else {
        nx /= nl;
        ny /= nl;
        nz /= nl;
      }
      normal[i * 3] = nx;
      normal[i * 3 + 1] = ny;
      normal[i * 3 + 2] = nz;
    }

    grow(segments, SEGMENT_KEYS, segments.count + n);

    const born0 = opts.born0 ?? 0;
    const born1 = opts.born1 ?? 1;
    const rand = opts.rand ?? (segments.count * 0.6180339887) % 1;
    const { s } = xf;
    const attr = (key, i, t, fallback) =>
      opts[key] === undefined ? fallback : value(opts[key], i, t);
    const radius = new Float64Array(n);
    const aspect = new Float64Array(n);
    const color = new Float64Array(n);
    const born = new Float64Array(n);
    const sag = new Float64Array(n);

    for (let i = 0; i < n; i += 1) {
      const t = arc[i] / total;

      radius[i] = attr('radius', i, t, 0.01) * s;
      aspect[i] = attr('aspect', i, t, 1);
      color[i] = attr('color', i, t, 0.5);
      sag[i] = attr('sag', i, t, 0) * s;
      born[i] = opts.born
        ? value(opts.born, i, t)
        : born0 + (born1 - born0) * t;
      include(world.subarray(i * 3, i * 3 + 3), radius[i] * aspect[i]);
    }

    const glow = opts.glow ?? 0;

    for (let i = 0; i < n - 1; i += 1) {
      const o = segments.count * 4;
      const j = i + 1;
      const t = (arc[i] + arc[j]) / 2 / total;

      segments.start.set(
        [world[i * 3], world[i * 3 + 1], world[i * 3 + 2], radius[i]],
        o
      );
      segments.end.set(
        [world[j * 3], world[j * 3 + 1], world[j * 3 + 2], radius[j]],
        o
      );
      octEncode(
        tangent[i * 3],
        tangent[i * 3 + 1],
        tangent[i * 3 + 2],
        segments.frameStart,
        o
      );
      octEncode(
        normal[i * 3],
        normal[i * 3 + 1],
        normal[i * 3 + 2],
        segments.frameStart,
        o + 2
      );
      octEncode(
        tangent[j * 3],
        tangent[j * 3 + 1],
        tangent[j * 3 + 2],
        segments.frameEnd,
        o
      );
      octEncode(
        normal[j * 3],
        normal[j * 3 + 1],
        normal[j * 3 + 2],
        segments.frameEnd,
        o + 2
      );
      segments.time.set(
        [born[i], Math.max(born[j], born[i]), aspect[i], aspect[j]],
        o
      );
      const occ = Math.min(1, Math.max(0, attr('occlusion', i, t, 1)));
      const shade = Math.min(1.99, Math.max(0, attr('shade', i, t, 1)));

      segments.tone.set([color[i], color[j], sag[i], sag[j]], o);
      segments.meta.set(
        [delay, glow, rand, Math.round(occ * 255) + shade / 2],
        o
      );
      segments.count += 1;
    }
  }

  function bead(
    x,
    y,
    z,
    r,
    { born = 0, color = 0.5, kind = 0, rand, sag = 0 } = {}
  ) {
    if (beads.count >= MAX_BEADS) {
      truncated = true;

      return;
    }
    grow(beads, BEAD_KEYS, beads.count + 1);
    const p = place(x, y, z);
    const o = beads.count * 4;

    beads.position.set([p[0], p[1], p[2], r * xf.s], o);
    beads.info.set(
      [born, color, delay, rand ?? (beads.count * 0.6180339887) % 1],
      o
    );
    beads.extra.set([kind, sag * xf.s, 0, 0], o);
    if (kind === BEAD_KIND.bead) include(p, r * xf.s);
    beads.count += 1;
  }

  const surfaces = [];

  // A solid triangle mesh in local space (flat xyz positions and normals, an
  // index), for bodies that are a surface rather than lines. Per-vertex
  // `born`/`color` arrays; `sag`/`occlusion` may be numbers or arrays.
  function surface({
    born,
    color,
    glow = 0,
    index,
    normals,
    occlusion = 1,
    positions,
    sag = 0,
  }) {
    const n = positions.length / 3;
    const out = {
      index,
      meta: new Float32Array(n * 4),
      normal: new Float32Array(n * 4),
      position: new Float32Array(n * 4),
    };
    const at = (v, i) => (typeof v === 'number' ? v : v[i]);

    for (let i = 0; i < n; i += 1) {
      const p = place(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      const nr = turn(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);

      out.position.set([p[0], p[1], p[2], born[i]], i * 4);
      out.normal.set([nr[0], nr[1], nr[2], color[i]], i * 4);
      out.meta.set([delay, at(sag, i) * xf.s, glow, at(occlusion, i)], i * 4);
      include(p, 0);
    }
    surfaces.push(out);
  }

  return {
    bead,
    fiber,
    surface,
    get segmentCount() {
      return segments.count;
    },
    setDelay(next) {
      delay = next;
    },
    setTransform(next) {
      xf = next ?? IDENTITY;
    },

    finish() {
      const trim = (store, keys) => {
        const out = { count: store.count };

        keys.forEach((key) => {
          out[key] = store[key].slice(0, store.count * 4);
        });

        return out;
      };

      const vertexCount = surfaces.reduce(
        (sum, m) => sum + m.position.length / 4,
        0
      );
      const indexCount = surfaces.reduce((sum, m) => sum + m.index.length, 0);
      const mesh = {
        count: vertexCount,
        index: new Uint32Array(indexCount),
        indexCount,
        meta: new Float32Array(vertexCount * 4),
        normal: new Float32Array(vertexCount * 4),
        position: new Float32Array(vertexCount * 4),
      };
      let v = 0;
      let k = 0;

      surfaces.forEach((m) => {
        mesh.position.set(m.position, v * 4);
        mesh.normal.set(m.normal, v * 4);
        mesh.meta.set(m.meta, v * 4);
        for (let i = 0; i < m.index.length; i += 1)
          mesh.index[k + i] = m.index[i] + v;
        v += m.position.length / 4;
        k += m.index.length;
      });

      return {
        beads: trim(beads, BEAD_KEYS),
        mesh,
        bounds: {
          max: [...max],
          min: [...min],
        },
        segments: trim(segments, SEGMENT_KEYS),
        truncated,
      };
    },
  };
}

// Tilt local +Y onto `up`, after spinning `yaw` about it.
export function memberTransform({ position, scale = 1, up, yaw = 0 }) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const yawM = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const [ux, uy, uz] = up;
  const axis = [uz, 0, -ux];
  const al = Math.hypot(axis[0], axis[2]);
  let tilt = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  if (al > 1e-6) {
    const kx = axis[0] / al;
    const kz = axis[2] / al;
    const c = uy;
    const s = al;
    const v = 1 - c;

    tilt = [
      c + kx * kx * v,
      -kz * s,
      kx * kz * v,
      kz * s,
      c,
      -kx * s,
      kx * kz * v,
      kx * s,
      c + kz * kz * v,
    ];
  }

  const m = new Array(9).fill(0);

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      for (let k = 0; k < 3; k += 1) {
        m[r * 3 + c] += tilt[r * 3 + k] * yawM[k * 3 + c];
      }
    }
  }

  return { m, s: scale, t: position };
}
