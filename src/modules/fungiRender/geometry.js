import * as THREE from 'three/webgpu';

const TAU = Math.PI * 2;

function valueNoise(seed) {
  const h = (x) => {
    const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return (t) => {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return h(i) * (1 - u) + h(i + 1) * u;
  };
}

// Plan-view margin outline: lobes, sharp star points at the alien end, and a
// little irregularity so no cap is a perfect circle.
export function marginShape(genome, seed) {
  const noise = valueNoise(seed);
  return (theta, along) => {
    const lobe =
      genome.lobes > 0
        ? (0.5 + 0.5 * Math.cos(theta * genome.lobes)) ** genome.lobeSharp
        : 0;
    const wobble = (noise((theta / TAU) * 9) - 0.5) * 0.06;
    return 1 + (wobble - genome.lobeDepth * lobe) * along ** 1.5;
  };
}

const sweep = (f, arc) => (f - 0.5) * TAU * arc;

// Sweeps (r, y) curves round the axis into one indexed surface; `extra`
// supplies per-ring attributes (flesh `thin`, `side`, radial `along`).
function lathe(rings, segments, shape, twist, extra, arc = 1) {
  const positions = [];
  const attrs = { along: [], side: [], theta: [], thin: [] };
  const indices = [];
  rings.forEach(([r, y, along], ring) => {
    for (let s = 0; s <= segments; s += 1) {
      const base = sweep(s / segments, arc);
      const theta = base + twist * along;
      const k = shape ? shape(base, along) : 1;
      positions.push(Math.cos(theta) * r * k, y, Math.sin(theta) * r * k);
      const e = extra(ring);
      attrs.along.push(along);
      attrs.side.push(e.side);
      attrs.theta.push(base);
      attrs.thin.push(e.thin);
    }
  });
  const stride = segments + 1;
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = ring * stride + s;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (arc < 1) {
    // A fan's cut sides: close each end with the section itself.
    const section = rings.map(([r, y]) => new THREE.Vector2(r, y));
    const faces = THREE.ShapeUtils.triangulateShape(section, []);
    [0, segments].forEach((s, end) => {
      faces.forEach(([a, b, c]) => {
        const [i, j, k] = [a, b, c].map((ring) => ring * stride + s);
        if (end === 0) indices.push(i, k, j);
        else indices.push(i, j, k);
      });
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  Object.entries(attrs).forEach(([name, values]) =>
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, 1))
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function capGeometry(profile, genome, seed, segments = 128) {
  const { top, under } = profile;
  const rings = [];
  const n = top.length / 2;
  for (let i = 0; i < n; i += 1) {
    rings.push([top[i * 2], top[i * 2 + 1], i / (n - 1), 0]);
  }
  const m = under.length / 2;
  for (let i = 1; i < m; i += 1) {
    rings.push([under[i * 2], under[i * 2 + 1], 1 - i / (m - 1), 1]);
  }
  const lastTop = n - 1;
  return lathe(
    rings.map(([r, y, along]) => [r, y, along]),
    segments,
    marginShape(genome, seed),
    genome.twist,
    (ring) => ({
      side: ring > lastTop ? 1 : 0,
      thin: rings[ring][2] ** 1.4,
    }),
    genome.arc
  );
}

// The hymenium as radial blades between the underside and the gill edge;
// every other blade is a shorter lamellula, as on a real cap.
export function gillGeometry(profile, genome, seed) {
  const { edge, under } = profile;
  const shape = marginShape(genome, seed);
  const count = Math.max(8, Math.round(genome.gillCount * genome.arc));
  const m = under.length / 2;
  const positions = [];
  const along = [];
  const thetas = [];
  const indices = [];
  for (let g = 0; g < count; g += 1) {
    const base = sweep((g + 0.5) / count, genome.arc);
    const start = g % 2 === 1 ? Math.floor(m * 0.45) : m - 1;
    const first = positions.length / 3;
    let rows = 0;
    for (let i = 0; i <= start; i += 1) {
      const f = 1 - i / (m - 1);
      const theta = base + genome.twist * f;
      const k = shape(base, f);
      const c = Math.cos(theta) * k;
      const s = Math.sin(theta) * k;
      positions.push(c * under[i * 2], under[i * 2 + 1], s * under[i * 2]);
      positions.push(c * edge[i * 2], edge[i * 2 + 1], s * edge[i * 2]);
      along.push(f, f);
      thetas.push(base, base);
      rows += 1;
    }
    for (let r = 0; r < rows - 1; r += 1) {
      const a = first + r * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  geometry.setAttribute('theta', new THREE.Float32BufferAttribute(thetas, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// A skirt or cup (veil ring, volva, pore layer) as an open lathe.
export function sheetGeometry(curve, arc = 1, segments = 96) {
  const rings = [];
  for (let i = 0; i < curve.length / 2; i += 1) {
    rings.push([curve[i * 2], curve[i * 2 + 1], i / (curve.length / 2 - 1)]);
  }
  return lathe(rings, segments, null, 0, () => ({ side: 1, thin: 0.6 }), arc);
}

// Stipe along its bent spine: each ring is centred on the spine point.
export function stipeGeometry(profile, segments = 64) {
  const { stipe } = profile;
  const n = stipe.length / 3;
  const positions = [];
  const along = [];
  const indices = [];
  for (let i = 0; i < n; i += 1) {
    const [r, y, x] = [stipe[i * 3], stipe[i * 3 + 1], stipe[i * 3 + 2]];
    for (let s = 0; s <= segments; s += 1) {
      const theta = (s / segments) * TAU;
      positions.push(x + Math.cos(theta) * r, y, Math.sin(theta) * r);
      along.push(i / (n - 1));
    }
  }
  const stride = segments + 1;
  for (let i = 0; i < n - 1; i += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = i * stride + s;
      indices.push(a, a + stride, a + 1, a + stride, a + stride + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const SHAPES = new WeakMap();

function shapeFor(genome, seed) {
  let bySeed = SHAPES.get(genome);
  if (!bySeed) {
    bySeed = new Map();
    SHAPES.set(genome, bySeed);
  }
  if (!bySeed.has(seed)) bySeed.set(seed, marginShape(genome, seed));
  return bySeed.get(seed);
}

// A point on the cap's top surface at (along 0..1 from apex, theta), with its
// outward normal, in cap-local space. Writes into `out` when given, since the
// rig calls this for every wart, bead and fibre on every growth step.
export function capSurfacePoint(profile, genome, seed, along, theta, out) {
  const { top } = profile;
  const n = top.length / 2;
  const t = along * (n - 1);
  const i = Math.min(n - 2, Math.floor(t));
  const f = t - i;
  const r = top[i * 2] + (top[i * 2 + 2] - top[i * 2]) * f;
  const y = top[i * 2 + 1] + (top[i * 2 + 3] - top[i * 2 + 1]) * f;
  const dr = top[i * 2 + 2] - top[i * 2];
  const dy = top[i * 2 + 3] - top[i * 2 + 1];
  const base = sweep((((theta / TAU) % 1) + 1) % 1, genome.arc);
  const k = shapeFor(genome, seed)(base, along);
  const phi = base + genome.twist * along;
  const len = Math.hypot(dr, dy) || 1;
  const nr = -dy / len;
  const ny = dr / len;
  const target = out ?? {
    normal: new THREE.Vector3(),
    position: new THREE.Vector3(),
  };
  target.normal.set(Math.cos(phi) * nr, ny, Math.sin(phi) * nr);
  target.position.set(Math.cos(phi) * r * k, y, Math.sin(phi) * r * k);
  return target;
}
