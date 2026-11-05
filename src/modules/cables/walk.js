import createNoise from './noise';

const DEG = Math.PI / 180;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// The reference reads the position, steers, steps, then tests the position
// it read, so every strand ends one step past the edge.
function walkFlat({ ang, noise, offset, options }) {
  const { bound, maxSteps, noiseScale, step, turn } = options;
  const points = [0, 0, 0];
  let x = 0;
  let y = 0;
  for (let i = 0; i < maxSteps; i += 1) {
    const px = x;
    const py = y;
    const n = noise.noise(offset + px * noiseScale, offset + py * noiseScale);
    const heading = (ang + n * turn) * DEG;
    x += step * Math.cos(heading);
    y += step * Math.sin(heading);
    points.push(x, 0, y);
    if (!(Math.abs(px) < bound && Math.abs(py) < bound)) break;
  }
  return points;
}

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};

// Rodrigues: rotate v about the unit axis k by angle.
const rotate = (v, k, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const kv = cross(k, v);
  const d = dot(k, v) * (1 - c);
  return [0, 1, 2].map((a) => v[a] * c + kv[a] * s + k[a] * d);
};

const local = (yaw, pitch) => [
  Math.cos(pitch) * Math.cos(yaw),
  Math.sin(pitch),
  Math.cos(pitch) * Math.sin(yaw),
];

// Strand i of n leaves the hole along a golden spiral over the cap within
// `spread` degrees of straight up.
function launch(i, n, spread) {
  const cap = 1 - Math.cos(spread * DEG);
  const cosPolar = 1 - ((i + 0.5) / n) * cap;
  const sinPolar = Math.sqrt(Math.max(0, 1 - cosPolar * cosPolar));
  const azimuth = i * GOLDEN;
  return [sinPolar * Math.cos(azimuth), cosPolar, sinPolar * Math.sin(azimuth)];
}

// The turtle's rule with a second noise for pitch: each strand's field is
// the shared field turned so its first step leaves along its launch
// direction, then twisted about it by the strand's `ang`, as the flat walk
// turns the whole field by `ang`.
function walkTangle({ ang, index, noise, offset, options, pitchNoise }) {
  const { bound, maxSteps, noiseScale, spread, step, strands, turn } = options;
  const sample = (x, y, z, field) =>
    field.noise3(
      offset + x * noiseScale,
      offset + y * noiseScale,
      offset + z * noiseScale
    );
  const heading = (x, y, z) =>
    local(
      sample(x, y, z, noise) * turn * DEG,
      sample(x, y, z, pitchNoise) * turn * DEG
    );
  const first = heading(0, 0, 0);
  const target = launch(index, strands, spread);
  const axis = cross(first, target);
  const sin = Math.hypot(...axis);
  const align = (v) =>
    sin < 1e-9
      ? v
      : rotate(v, normalize(axis), Math.atan2(sin, dot(first, target)));
  const twist = (v) => rotate(align(v), target, ang * DEG);

  const points = [0, 0, 0];
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < maxSteps; i += 1) {
    const d = twist(heading(x, y, z));
    x += step * d[0];
    y += step * d[1];
    z += step * d[2];
    points.push(x, y, z);
    if (y < 0 || Math.hypot(x, y, z) >= bound) break;
  }
  return points;
}

// Every strand of the drawing in turtle units (the reference's canvas is
// ±100), y up: the flat layout walks the floor plane (turtle y → z).
export default function walkStrands(options, rng) {
  const noise = createNoise(rng, options.octaves);
  const offset = 100 * rng();
  const pitchNoise =
    options.layout === 'tangle' ? createNoise(rng, options.octaves) : null;
  const strands = [];
  for (let index = 0; index < options.strands; index += 1) {
    const ang = (index * 360) / options.strands;
    const args = { ang, index, noise, offset, options, pitchNoise };
    strands.push(
      options.layout === 'tangle' ? walkTangle(args) : walkFlat(args)
    );
  }
  return strands;
}
