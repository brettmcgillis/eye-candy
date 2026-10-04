import profileRing from './profiles';

const UP = [0, 1, 0];
const CAP_RINGS = 6;
const BEAD_RINGS = 8;
// A ring is kept once the strand has turned or climbed this far (radians)
// since the last one, its taper has changed this share of its radius, or
// it has run this many solver samples straight.
const MAX_TURN = 0.05;
const MAX_TAPER = 0.04;
const MAX_RUN = 8;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length > 1e-12 ? scale(v, 1 / length) : null;
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Grid units, centred, lying on the ground: grid x → x, grid y → z, height → y.
function localPoints(chain, half) {
  const n = chain.points.length / 3;
  return Array.from({ length: n }, (_, k) => [
    chain.points[k * 3] - half,
    chain.points[k * 3 + 2],
    chain.points[k * 3 + 1] - half,
  ]);
}

function tangents(points, loop) {
  const n = points.length;
  return points.map((_, k) => {
    const wrapPrev = loop ? points[n - 1] : points[k];
    const wrapNext = loop ? points[0] : points[k];
    const prev = k > 0 ? points[k - 1] : wrapPrev;
    const next = k < n - 1 ? points[k + 1] : wrapNext;
    return normalize(sub(next, prev)) ?? [1, 0, 0];
  });
}

function keptIndices(points, frames, colorKey, radii, loop) {
  const n = points.length;
  const kept = [0];
  for (let k = 1; k < n - 1; k += 1) {
    const last = kept[kept.length - 1];
    const turn = Math.acos(Math.min(1, dot(frames[k], frames[last])));
    if (
      turn > MAX_TURN ||
      Math.abs(radii[k] - radii[last]) > radii[last] * MAX_TAPER ||
      k - last >= MAX_RUN ||
      colorKey(k) !== colorKey(last)
    ) {
      kept.push(k);
    }
  }
  if (n > 1) kept.push(n - 1);
  if (loop && kept.length > 1 && kept[kept.length - 1] === n - 1) {
    const last = kept[kept.length - 2];
    if (n - 1 - last < MAX_RUN && colorKey(n - 1) === colorKey(last))
      kept.pop();
  }
  return kept;
}

function sideOf(tangent, previous) {
  return normalize(cross(tangent, UP)) ?? previous ?? [0, 0, 1];
}

// One chain as rings of the profile; an open chain gets a domed cap at each
// end (the profile shrinking to a point over a quarter turn).
function chainRings(chain, half, profile, colorKey) {
  const points = localPoints(chain, half);
  const tangent = tangents(points, chain.loop);
  const kept = keptIndices(points, tangent, colorKey, chain.radii, chain.loop);
  const rings = [];
  let side = null;
  kept.forEach((k) => {
    side = sideOf(tangent[k], side);
    const up = cross(side, tangent[k]);
    rings.push({ center: points[k], k, side, tangent: tangent[k], up });
  });
  return { kept, rings };
}

function countFor(chain, rings, ringSize) {
  if (chain.kind === 'bead') return { indices: 0, vertices: 0 };
  const segments = chain.loop ? rings.length : rings.length - 1;
  const caps = chain.loop || rings.length < 1 ? 0 : 2;
  return {
    indices:
      segments * ringSize * 6 +
      caps * ((CAP_RINGS - 1) * ringSize * 6 + ringSize * 3),
    vertices: rings.length * ringSize + caps * ((CAP_RINGS - 1) * ringSize + 1),
  };
}

function beadCount(segments) {
  return {
    indices: BEAD_RINGS * segments * 6,
    vertices: (BEAD_RINGS + 1) * (segments + 1),
  };
}

// What a ring may be decimated across: a lane's colour only changes where
// its cell, slot or lane does (or continuously, in Spectrum).
function colorKeyFor(tubes, config) {
  const spectrum = config.blobLaneMode === 'Spectrum' && !config.blobMonochrome;
  return (c, k) => {
    const chain = tubes.chains[c];
    if (chain.kind === 'wire') return 0;
    const key = `${chain.cell[k]}:${chain.slot[k]}:${chain.lane[k]}`;
    return spectrum ? `${key}:${Math.round(chain.u[k] * 8)}` : key;
  };
}

export const MESH_KEYS = [
  'blobLaneMode',
  'blobMonochrome',
  'ribbonHeight',
  'tubeProfile',
  'tubeSegments',
];

// Every chain swept into one indexed triangle mesh, in centred grid units
// (x right, y up, z toward the viewer) — plain typed arrays, so a worker can
// build it and a future STL export can write the same triangles. `sampleOf`
// maps each vertex back to its chain sample (offsets in chain order), so a
// palette change rewrites colours without rebuilding; `center` is the
// centreline point plus the moment that sample grows in.
export default function buildTubeMesh(tubes, config) {
  const colorKeyOf = colorKeyFor(tubes, config);
  const half = tubes.gridSize / 2;
  const profile = profileRing(config);
  const ringSize = profile.length;
  const beadSegments = Math.max(8, Math.round(config.tubeSegments));
  const offsets = [];
  let samples = 0;
  const built = tubes.chains.map((chain, c) => {
    offsets.push(samples);
    samples += chain.points.length / 3;
    if (chain.kind === 'bead') return { count: beadCount(beadSegments) };
    const out = chainRings(chain, half, profile, (k) => colorKeyOf(c, k));
    return { ...out, count: countFor(chain, out.rings, ringSize) };
  });
  const total = built.reduce(
    (sum, { count }) => ({
      indices: sum.indices + count.indices,
      vertices: sum.vertices + count.vertices,
    }),
    { indices: 0, vertices: 0 }
  );

  const position = new Float32Array(total.vertices * 3);
  const normal = new Float32Array(total.vertices * 3);
  const center = new Float32Array(total.vertices * 4);
  const sampleOf = new Uint32Array(total.vertices);
  const index = new Uint32Array(total.indices);
  let v = 0;
  let t = 0;

  const vertex = (p, n, c, grow, sample) => {
    position.set(p, v * 3);
    normal.set(normalize(n) ?? UP, v * 3);
    center.set([c[0], c[1], c[2], grow], v * 4);
    sampleOf[v] = sample;
    v += 1;
    return v - 1;
  };
  const quad = (a, b, c, d) => {
    index.set([a, c, b, b, c, d], t);
    t += 6;
  };
  const stitch = (from, to) => {
    for (let i = 0; i < ringSize; i += 1) {
      const j = (i + 1) % ringSize;
      quad(from + i, from + j, to + i, to + j);
    }
  };

  tubes.chains.forEach((chain, c) => {
    const base = offsets[c];
    if (chain.kind === 'bead') {
      const p = [
        chain.points[0] - half,
        chain.points[2],
        chain.points[1] - half,
      ];
      const first = v;
      for (let lat = 0; lat <= BEAD_RINGS; lat += 1) {
        const phi = (lat / BEAD_RINGS) * Math.PI;
        for (let lon = 0; lon <= beadSegments; lon += 1) {
          const theta = (lon / beadSegments) * Math.PI * 2;
          const n = [
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta),
          ];
          vertex(add(p, scale(n, chain.radius)), n, p, chain.grow[0], base);
        }
      }
      for (let lat = 0; lat < BEAD_RINGS; lat += 1) {
        for (let lon = 0; lon < beadSegments; lon += 1) {
          const a = first + lat * (beadSegments + 1) + lon;
          const b = a + beadSegments + 1;
          index.set([a, a + 1, b, b, a + 1, b + 1], t);
          t += 6;
        }
      }
      return;
    }

    const { rings } = built[c];
    const H = chain.radius;
    const starts = rings.map((ring) => {
      const W = chain.radii[ring.k];
      const start = v;
      profile.forEach(({ a, b, na, nb }) => {
        const offset = add(scale(ring.side, a * W), scale(ring.up, b * H));
        const n = add(scale(ring.side, na * H), scale(ring.up, nb * W));
        vertex(
          add(ring.center, offset),
          n,
          ring.center,
          chain.grow[ring.k],
          base + ring.k
        );
      });
      return start;
    });
    for (let r = 0; r < rings.length - 1; r += 1)
      stitch(starts[r], starts[r + 1]);
    if (chain.loop) {
      stitch(starts[rings.length - 1], starts[0]);
      return;
    }

    [
      [rings[0], starts[0], -1],
      [rings[rings.length - 1], starts[rings.length - 1], 1],
    ].forEach(([ring, ringStart, direction]) => {
      // Caps point level along the strand, so an end on a slope (or at the
      // foot of a crossing dip) rounds off instead of aiming up or down.
      const level = normalize([ring.tangent[0], 0, ring.tangent[2]]);
      const along = scale(level ?? ring.tangent, direction);
      const grow = chain.grow[ring.k];
      const W = chain.radii[ring.k];
      let previous = ringStart;
      for (let j = 1; j < CAP_RINGS; j += 1) {
        const phi = (j / CAP_RINGS) * (Math.PI / 2);
        const shrink = Math.cos(phi);
        const ahead = scale(along, W * Math.sin(phi));
        const start = v;
        profile.forEach(({ a, b, na, nb }) => {
          const offset = add(
            scale(ring.side, a * W * shrink),
            scale(ring.up, b * H * shrink)
          );
          const n = add(
            scale(
              add(scale(ring.side, na * H), scale(ring.up, nb * W)),
              shrink / Math.max(W, H)
            ),
            scale(along, Math.sin(phi))
          );
          vertex(
            add(add(ring.center, ahead), offset),
            n,
            ring.center,
            grow,
            base + ring.k
          );
        });
        if (direction > 0) stitch(previous, start);
        else stitch(start, previous);
        previous = start;
      }
      const tip = vertex(
        add(ring.center, scale(along, W)),
        along,
        ring.center,
        grow,
        base + ring.k
      );
      for (let i = 0; i < ringSize; i += 1) {
        const j = (i + 1) % ringSize;
        if (direction > 0) index.set([previous + i, tip, previous + j], t);
        else index.set([tip, previous + i, previous + j], t);
        t += 3;
      }
    });
  });

  return { center, index, normal, position, sampleOf, samples };
}
