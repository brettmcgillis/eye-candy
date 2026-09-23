/* eslint-disable no-param-reassign */
import stemCurve from './stem';

const TAU = Math.PI * 2;
const UP = [0, 1, 0];

const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
};

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function rotate(v, axis, angle) {
  const k = unit(axis);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = cross(k, v);

  return [0, 1, 2].map((i) => v[i] * c + x[i] * s + k[i] * d * (1 - c));
}

function createHash(cell) {
  const map = new Map();
  const key = (x, y, z) =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;

  return {
    add(p, r, owner) {
      const k = key(p[0], p[1], p[2]);

      if (!map.has(k)) map.set(k, []);
      map.get(k).push([p[0], p[1], p[2], r, owner]);
    },
    clear(p, r, skip, margin) {
      const cx = Math.floor(p[0] / cell);
      const cy = Math.floor(p[1] / cell);
      const cz = Math.floor(p[2] / cell);
      const w = Math.ceil((r * margin * 2) / cell) + 1;

      for (let i = cx - w; i <= cx + w; i += 1) {
        for (let j = cy - w; j <= cy + w; j += 1) {
          for (let k = cz - w; k <= cz + w; k += 1) {
            const list = map.get(`${i},${j},${k}`);

            if (list) {
              for (let q = 0; q < list.length; q += 1) {
                const [x, y, z, rq, owner] = list[q];

                if (!skip.has(owner)) {
                  const d = Math.hypot(x - p[0], y - p[1], z - p[2]);

                  if (d < (r + rq) * margin) return false;
                }
              }
            }
          }
        }
      }

      return true;
    },
  };
}

// The coral's skeleton: a stout trunk forking again and again, each fork in a
// plane turned from its parent's, bending up towards the light and turned
// back inward past the crown's reach. A branch that would run into another is
// swung round or dropped, so no two ever pass through each other.
function growSkeleton(c, rng) {
  const segments = [];
  const hash = createHash(c.trunk * 1.2);
  const depthMax = Math.max(3, Math.round(c.depth));
  const lean = [rng.signed() * 0.12, 1, rng.signed() * 0.12];

  function sampleOf(seg) {
    const pts = [];

    for (let k = 1; k <= 6; k += 1) {
      const u = k / 6;

      pts.push([
        seg.start[0] + (seg.end[0] - seg.start[0]) * u,
        seg.start[1] + (seg.end[1] - seg.start[1]) * u,
        seg.start[2] + (seg.end[2] - seg.start[2]) * u,
        seg.radius * (1 - 0.3 * u),
      ]);
    }

    return pts;
  }

  function add(seg) {
    seg.index = segments.length;
    segments.push(seg);
    sampleOf(seg).forEach((p) => hash.add(p, p[3], seg.index));
  }

  add({
    depth: 0,
    dir: unit(lean),
    end: unit(lean).map((v) => v * c.trunkLength),
    length: c.trunkLength,
    parent: -1,
    plane: rng() * TAU,
    radius: c.trunk,
    start: [0, 0, 0],
  });

  for (let s = 0; s < segments.length; s += 1) {
    const parent = segments[s];

    if (parent.depth < depthMax) {
      const forks = rng.chance(c.triple) ? 3 : 2;
      const plane = parent.plane + Math.PI / 2 + rng.signed() * 0.5;
      const skip = new Set([parent.index, parent.parent]);
      const made = [];

      for (let f = 0; f < forks; f += 1) {
        let spread = f - 1;

        if (forks === 2) spread = f ? 1 : -1;
        const base = parent.depth === 0 ? c.firstLength : c.shrink;
        const length =
          parent.length *
          base *
          rng.range(0.85, 1.15) *
          (forks === 3 ? 0.9 : 1);
        const radius = parent.radius * c.taper * (forks === 3 ? 0.9 : 1);
        let placed = null;

        for (let attempt = 0; attempt < 8 && !placed; attempt += 1) {
          const reachScale = attempt < 4 ? 1 : 0.75;
          const swing =
            attempt === 0
              ? 0
              : (attempt % 2 ? 1 : -1) * Math.ceil(attempt / 2) * 0.45;
          const axisIn = cross(parent.dir, [
            Math.cos(plane + swing),
            0,
            Math.sin(plane + swing),
          ]);
          const angle =
            c.angle * spread * (1 - attempt * 0.08) * rng.range(0.8, 1.2);
          let dir = rotate(parent.dir, axisIn, angle);
          const flat = Math.hypot(parent.end[0], parent.end[2]);

          dir = unit(dir.map((v, i) => v + UP[i] * c.upturn));
          if (flat > c.reach) {
            dir = unit([
              dir[0] - (parent.end[0] / flat) * 0.5,
              dir[1] + 0.3,
              dir[2] - (parent.end[2] / flat) * 0.5,
            ]);
          }
          if (dir[1] < 0.25) dir = unit([dir[0], 0.25, dir[2]]);
          const end = parent.end.map(
            (v, i) => v + dir[i] * length * reachScale
          );
          const seg = {
            depth: parent.depth + 1,
            dir,
            end,
            length: length * reachScale,
            parent: parent.index,
            plane: plane + swing,
            radius,
            start: parent.end,
          };
          const siblings = new Set([...skip, ...made]);
          const clear = sampleOf(seg)
            .slice(1)
            .every((q, k, all) =>
              hash.clear(
                q,
                q[3],
                k < all.length - 1 ? siblings : skip,
                k < all.length - 1 ? 1.2 : 1
              )
            );

          if (clear) {
            placed = seg;
          }
        }
        if (placed) {
          add(placed);
          made.push(placed.index);
        }
      }
      parent.tip = made.length === 0;
    } else {
      parent.tip = true;
    }
  }

  return segments;
}

// A coral fungus (Ramaria / Clavulina): a trunk that forks into a crown of
// blunt or crested tines, every branch a bundle of hyphae in two staggered
// layers, emerging from the core of the branch it forks from.
export default function buildCoral(e, g, rng, noise, detail = 1) {
  const c = g.coral;
  const segments = growSkeleton(c, rng);
  let top = 0;
  const along = new Float64Array(segments.length);

  segments.forEach((seg) => {
    top = Math.max(top, seg.end[1]);
    along[seg.index] = (seg.parent >= 0 ? along[seg.parent] : 0) + seg.length;
  });
  const fit = c.height / Math.max(1e-3, top);
  const longest = Math.max(...along);
  const p = [0, 0, 0];
  const fiberCount = (r) =>
    Math.max(8, Math.round(c.fibers * detail * (r / c.trunk)));

  segments.forEach((seg) => {
    const parent = seg.parent >= 0 ? segments[seg.parent] : null;
    const back = parent ? parent.radius * 0.6 : 0;
    const extend = seg.tip ? 0 : seg.radius * c.taper * 0.6;
    const end = seg.end.map((v, i) => v + seg.dir[i] * extend);
    const start = parent
      ? seg.start.map((v, i) => v - parent.dir[i] * back)
      : seg.start;
    const curve = stemCurve({
      alignTop: false,
      foot: start.map((v) => v * fit),
      footDir: parent ? parent.dir : seg.dir,
      lane: rng(),
      top: end.map((v) => v * fit),
      topDir: seg.dir,
      wobble: 0.04,
    });
    const r0 = seg.radius * fit;
    const r1 = (seg.tip ? seg.radius * c.tipTaper : seg.radius * c.taper) * fit;
    const count = fiberCount(seg.radius);
    const width = ((Math.PI * r0) / count) * 1.5;
    const from = (along[seg.index] - seg.length) / longest;
    const to = along[seg.index] / longest;
    const samples = Math.max(
      8,
      Math.min(28, Math.round(curve.length / (r0 * 0.6)))
    );

    [
      { depth: 1, offset: 0 },
      { depth: 0.82, offset: 0.5 },
    ].forEach((layer, li) => {
      for (let j = 0; j < count; j += 1) {
        const phi0 = (TAU * (j + layer.offset)) / count + rng.signed() * 0.03;
        const pts = [];

        for (let k = 0; k <= samples; k += 1) {
          const v = k / samples;
          const emerge = parent ? Math.min(1, v / 0.15) ** 0.7 : 1;
          const tuck = seg.tip
            ? 1
            : 1 - 0.45 * Math.max(0, (v - 0.82) / 0.18) ** 2;
          const r =
            (r0 + (r1 - r0) * v ** 1.2) *
            layer.depth *
            (0.75 + 0.25 * emerge) *
            tuck *
            (1 + noise.noise2(phi0 * 2 + seg.index, v * 3) * 0.06);
          const phi =
            phi0 +
            c.twist * v +
            noise.noise1(v * 2 + j * 0.3, seg.index) * 0.05;

          curve.surface(v, phi, r, p);
          pts.push(p[0], p[1], p[2]);
        }
        e.fiber(pts, {
          born: (i, t) => 0.05 + 0.9 * (from + (to - from) * t),
          color: (i, t) => (from + (to - from) * t) ** 0.8,
          occlusion: li === 0 ? 1 : 0.7,
          rand: rng(),
          radius: (i, t) =>
            width * (1 - 0.6 * t * (seg.tip ? 1 : 0.3)) * layer.depth,
          shade: 0.88 + rng() * 0.24,
        });
      }
    });

    if (seg.tip && rng() < c.crest) {
      const tines = 2 + Math.floor(rng() * 3);
      const tipR = r1;

      for (let t = 0; t < tines; t += 1) {
        const a = (TAU * t) / tines + rng.signed() * 0.4;
        const { b, n, t: tan } = curve.frame(1);
        const out = n.map((v, i) => v * Math.cos(a) + b[i] * Math.sin(a));
        const len = tipR * rng.range(2, 4);
        const base = curve.point(0.94);
        const pts = [];

        for (let k = 0; k <= 4; k += 1) {
          const u = k / 4;

          for (let i = 0; i < 3; i += 1) {
            pts.push(base[i] + tan[i] * len * u + out[i] * len * 0.6 * u * u);
          }
        }
        e.fiber(pts, {
          born0: 0.9,
          born1: 1,
          color: 1,
          rand: rng(),
          radius: (i, u) => tipR * 0.5 * (1 - 0.8 * u),
        });
      }
    }
  });

  return { height: c.height };
}
