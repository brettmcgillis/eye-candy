/* eslint-disable no-param-reassign */
import createNoise from './noise';

const SAMPLES = 96;

const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
};

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// A stem's centreline from `foot` to `top`: leaves the foot along `footDir`,
// arrives along `topDir`, with a travelling S-bend (`sway`) and slow wander
// (`wobble`), both as fractions of the rise and zero at either end. Sampled
// by arc length with parallel-transported frames; `alignTop` spins the frames
// so azimuth 0 at the top is +X, the axis cap surfaces are written in.
export default function stemCurve({
  alignTop = true,
  foot = [0, 0, 0],
  footDir = [0, 1, 0],
  lane = 0,
  sway = 0,
  swayPhase = 0,
  swayShift = 0,
  top,
  topDir = [0, 1, 0],
  wobble = 0,
}) {
  const noise = createNoise(lane);
  const rise = Math.hypot(top[0] - foot[0], top[1] - foot[1], top[2] - foot[2]);
  const d0 = unit(footDir);
  const d1 = unit(topDir);
  const handle = rise * 0.42;
  const p1 = foot.map((v, i) => v + d0[i] * handle);
  const p2 = top.map((v, i) => v - d1[i] * handle);
  const across = [Math.cos(swayPhase), 0, Math.sin(swayPhase)];
  const across2 = [-across[2], 0, across[0]];
  const raw = new Float64Array((SAMPLES + 1) * 3);

  for (let k = 0; k <= SAMPLES; k += 1) {
    const u = k / SAMPLES;
    const a = (1 - u) ** 3;
    const b = 3 * (1 - u) ** 2 * u;
    const c = 3 * (1 - u) * u * u;
    const d = u ** 3;
    const envelope = Math.sin(Math.PI * u) ** 1.4;
    const s = rise * envelope;
    const bend = sway * Math.sin(Math.PI * u * 1.6 + swayShift);
    const w1 = wobble * noise.noise1(u * 2.6, 1);
    const w2 = wobble * noise.noise1(u * 2.6, 2);

    for (let i = 0; i < 3; i += 1) {
      raw[k * 3 + i] =
        a * foot[i] +
        b * p1[i] +
        c * p2[i] +
        d * top[i] +
        s * (across[i] * (bend + w1) + across2[i] * w2 * 0.8);
    }
  }

  const arc = new Float64Array(SAMPLES + 1);

  for (let k = 1; k <= SAMPLES; k += 1) {
    arc[k] =
      arc[k - 1] +
      Math.hypot(
        raw[k * 3] - raw[k * 3 - 3],
        raw[k * 3 + 1] - raw[k * 3 - 2],
        raw[k * 3 + 2] - raw[k * 3 - 1]
      );
  }
  const length = arc[SAMPLES] || 1;
  const points = new Float64Array((SAMPLES + 1) * 3);
  let seg = 0;

  for (let k = 0; k <= SAMPLES; k += 1) {
    const want = (k / SAMPLES) * length;

    while (seg < SAMPLES - 1 && arc[seg + 1] < want) seg += 1;
    const span = arc[seg + 1] - arc[seg] || 1;
    const f = Math.min(1, Math.max(0, (want - arc[seg]) / span));

    for (let i = 0; i < 3; i += 1) {
      points[k * 3 + i] =
        raw[seg * 3 + i] + (raw[seg * 3 + 3 + i] - raw[seg * 3 + i]) * f;
    }
  }

  const tangents = [];

  for (let k = 0; k <= SAMPLES; k += 1) {
    const a = Math.max(0, k - 1);
    const b = Math.min(SAMPLES, k + 1);

    tangents.push(
      unit([
        points[b * 3] - points[a * 3],
        points[b * 3 + 1] - points[a * 3 + 1],
        points[b * 3 + 2] - points[a * 3 + 2],
      ])
    );
  }
  tangents[0] = d0;
  tangents[SAMPLES] = d1;

  const normals = [];
  let n = [1, 0, 0];

  {
    const t = tangents[0];
    const proj = n.map((v, i) => v - t[i] * dot(n, t));

    n = Math.hypot(...proj) > 1e-4 ? unit(proj) : [0, 0, 1];
  }
  normals.push(n);
  for (let k = 1; k <= SAMPLES; k += 1) {
    const t = tangents[k];
    const along = dot(n, t);

    n = unit([n[0] - t[0] * along, n[1] - t[1] * along, n[2] - t[2] * along]);
    normals.push(n);
  }

  let spin = 0;

  if (alignTop) {
    const nt = normals[SAMPLES];
    const t = tangents[SAMPLES];
    const x = [1, 0, 0].map((v, i) => v - t[i] * t[0]);
    const xl = Math.hypot(...x);

    if (xl > 1e-4) {
      const xu = x.map((v) => v / xl);

      spin = Math.atan2(dot(cross(xu, nt), t), dot(nt, xu));
    }
  }

  function frame(v) {
    const f = Math.min(1, Math.max(0, v)) * SAMPLES;
    const k = Math.min(SAMPLES - 1, Math.floor(f));
    const w = f - k;
    const t = unit(tangents[k].map((a, i) => a + (tangents[k + 1][i] - a) * w));
    let nn = normals[k].map((a, i) => a + (normals[k + 1][i] - a) * w);

    nn = unit(nn.map((a, i) => a - t[i] * dot(nn, t)));
    const b0 = cross(nn, t);
    const ang = spin * Math.min(1, Math.max(0, v));
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const nr = nn.map((a, i) => a * c + b0[i] * s);
    const br = cross(nr, t);

    return { b: br, n: nr, t };
  }

  function point(v, out = [0, 0, 0]) {
    const f = Math.min(1, Math.max(0, v)) * SAMPLES;
    const k = Math.min(SAMPLES - 1, Math.floor(f));
    const w = f - k;

    for (let i = 0; i < 3; i += 1) {
      out[i] =
        points[k * 3 + i] + (points[k * 3 + 3 + i] - points[k * 3 + i]) * w;
    }

    return out;
  }

  function surface(v, phi, r, out = [0, 0, 0]) {
    const { b, n: nn } = frame(v);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    point(v, out);
    for (let i = 0; i < 3; i += 1) out[i] += (nn[i] * c + b[i] * s) * r;

    return out;
  }

  return { frame, length, point, surface };
}
