import { createRng } from '@modules/flora';

// plume: the FireAndSmoke smoke (flame-style blobs growing along the path);
// particles / volumetric / layered: the particle smoke system as Particle,
// Volumetric or Both; mixed: plume and particles, as authored.
const SMOKE_TYPES = {
  layered: 'Both',
  mixed: 'Particle',
  particles: 'Particle',
  volumetric: 'Volumetric',
};

export function smokeVisibility(system) {
  return {
    particles: SMOKE_TYPES[system] ?? null,
    plume: system === 'mixed' || system === 'plume',
  };
}

const DEG = Math.PI / 180;

// How far, in metres, the smoke's sway and jitter take to reach full size.
const SMOKE_REACH_M = 12;

function arcDistances(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay, az] = points[i - 1];
    const [bx, by, bz] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay, bz - az));
  }
  return lengths;
}

// One displacement field for every smoke path in a generation: a function
// of distance from the dumpster in metres, phased by `smokeSeed` alone, so
// the fire, the plume and the particle stream bend together however long
// or scaled their splines are.
function smokeField(config) {
  const rng = createRng(`smoke:${config.smokeSeed}`);
  const phase = rng() * Math.PI * 2;
  const depthPhase = rng() * Math.PI * 2;
  const wobble = [0, 1, 2].map(() => [
    rng() * Math.PI * 2,
    rng() * Math.PI * 2,
  ]);
  const sway = config.smokeSway * SMOKE_REACH_M;
  const jitter = config.smokeJitter * SMOKE_REACH_M;
  const turn = (config.smokeWaves * Math.PI * 2) / SMOKE_REACH_M;
  return (d) => {
    const grow = Math.min(1, d / SMOKE_REACH_M);
    const smooth = ([p1, p2]) =>
      0.6 * Math.sin(d * 2.1 + p1) + 0.4 * Math.sin(d * 4.8 + p2);
    return {
      across: sway * grow * Math.sin(phase + d * turn),
      jitter: wobble.map((phases) => jitter * grow * smooth(phases)),
      through: sway * 0.6 * grow * Math.sin(depthPhase + d * turn * 0.65),
    };
  };
}

// A smoke path redrawn by the generation, in its spline's own frame
// (`scale`: the spline group's scale, so the field is laid out in metres):
// mirrored across its first point (`smokeMirror`), leaned up or down by
// `smokeLean` degrees, stretched by `smokeReach`, swayed across and through
// the page (`smokeSway`, `smokeWaves`) and jittered (`smokeJitter`), all
// growing from nothing at the dumpster. Every default leaves the authored
// path exactly as it was.
export function bendSmokePoints(points, config, scale = 1) {
  if (points.length < 2) return points.map((p) => [...p]);
  const [ox, oy, oz] = points[0];
  const distances = arcDistances(points);
  const field = smokeField(config);
  const lean = config.smokeLean * DEG;
  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  const reach = config.smokeReach;
  return points.map(([x, y, z], i) => {
    if (i === 0) return [x, y, z];
    const { across, jitter, through } = field(distances[i] * reach * scale);
    let dx = (x - ox) * reach;
    let dy = (y - oy) * reach;
    let dz = (z - oz) * reach;
    [dx, dy] = [dx * cos - dy * sin, dx * sin + dy * cos];
    const along = Math.hypot(dx, dy) || 1;
    const [px, py] = [-dy / along, dx / along];
    dx += (px * across + jitter[0]) / scale;
    dy += (py * across + jitter[1]) / scale;
    dz += (through + jitter[2]) / scale;
    if (config.smokeMirror) dx = -dx;
    return [ox + dx, oy + dy, oz + dz];
  });
}

// three's CatmullRomCurve3.getPoint, three-free: `type` centripetal,
// chordal or catmullrom (with `tension`).
export function catmullRom(points, { closed = false, tension = 0.5, type }) {
  const n = points.length;
  const pow = type === 'chordal' ? 0.5 : 0.25;
  const coef = (x0, x1, t0, t1) => [
    x0,
    t0,
    -3 * x0 + 3 * x1 - 2 * t0 - t1,
    2 * x0 - 2 * x1 + t0 + t1,
  ];
  const nonUniform = (x0, x1, x2, x3, dt0, dt1, dt2) => {
    let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
    let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
    t1 *= dt1;
    t2 *= dt1;
    return coef(x1, x2, t1, t2);
  };
  const dist2 = (a, b) =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  return (t) => {
    const p = (n - (closed ? 0 : 1)) * t;
    let intPoint = Math.floor(p);
    let weight = p - intPoint;
    if (closed) {
      intPoint +=
        intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / n) + 1) * n;
    } else if (weight === 0 && intPoint === n - 1) {
      intPoint = n - 2;
      weight = 1;
    }
    const p1 = points[intPoint % n];
    const p2 = points[(intPoint + 1) % n];
    const p0 =
      closed || intPoint > 0
        ? points[(intPoint - 1 + n) % n]
        : p1.map((v, k) => v - (p2[k] - v));
    const p3 =
      closed || intPoint + 2 < n
        ? points[(intPoint + 2) % n]
        : points[n - 1].map((v, k) => v - (points[n - 2][k] - v));
    let cs;
    if (type === 'centripetal' || type === 'chordal') {
      let dt0 = dist2(p0, p1) ** pow;
      let dt1 = dist2(p1, p2) ** pow;
      let dt2 = dist2(p2, p3) ** pow;
      if (dt1 < 1e-4) dt1 = 1;
      if (dt0 < 1e-4) dt0 = dt1;
      if (dt2 < 1e-4) dt2 = dt1;
      cs = [0, 1, 2].map((k) =>
        nonUniform(p0[k], p1[k], p2[k], p3[k], dt0, dt1, dt2)
      );
    } else {
      cs = [0, 1, 2].map((k) =>
        coef(p1[k], p2[k], tension * (p2[k] - p0[k]), tension * (p3[k] - p1[k]))
      );
    }
    const w2 = weight * weight;
    const w3 = w2 * weight;
    return cs.map(([c0, c1, c2, c3]) => c0 + c1 * weight + c2 * w2 + c3 * w3);
  };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Streamlines for the plot: `count` lines wound along each smoke path's
// tube, each at its own depth and angle in the cross-section, twisting
// `twist` turns along the path and breathing in and out. A path is
// `{ curve: t → [x, y, z] (world), radius: t → metres, end }`: the lines
// stop by `end` (0–1, default 1), where the smoke itself gives out.
export function flowLines(paths, { count, seed, twist }) {
  const rng = createRng(`flow:${seed}`);
  const lines = [];
  paths.forEach(({ curve, end = 1, radius }) => {
    const samples = 160;
    const centers = Array.from({ length: samples + 1 }, (_, i) =>
      curve(i / samples)
    );
    let normal = null;
    const frames = centers.map((c, i) => {
      const tangent = norm(
        sub(centers[Math.min(i + 1, samples)], centers[Math.max(i - 1, 0)])
      );
      if (!normal) {
        const ref = Math.abs(tangent[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        normal = norm(cross(cross(tangent, ref), tangent));
      }
      const binormal = norm(cross(tangent, normal));
      normal = norm(cross(binormal, tangent));
      return { binormal, normal };
    });
    for (let k = 0; k < count; k += 1) {
      const angle0 = (k / count) * Math.PI * 2 + rng() * 0.5;
      const depth = Math.sqrt(0.15 + rng() * 0.85);
      const breathe = rng() * Math.PI * 2;
      const start = Math.floor(rng() * 0.12 * samples);
      const last = Math.floor(end * samples * (1 - rng() * 0.25));
      const line = [];
      for (let i = start; i <= last; i += 1) {
        const t = i / samples;
        const angle = angle0 + twist * t * Math.PI * 2;
        const r = radius(t) * depth * (0.85 + 0.15 * Math.sin(breathe + t * 9));
        const { binormal, normal: nrm } = frames[i];
        const ca = Math.cos(angle) * r;
        const sa = Math.sin(angle) * r;
        const c = centers[i];
        line.push([
          c[0] + nrm[0] * ca + binormal[0] * sa,
          c[1] + nrm[1] * ca + binormal[1] * sa,
          c[2] + nrm[2] * ca + binormal[2] * sa,
        ]);
      }
      if (line.length > 1) lines.push(line);
    }
  });
  return lines;
}
