import * as THREE from 'three';
import { NURBSSurface, ParametricGeometry } from 'three-stdlib';

// ── Gerstner wave constants (shared between GL + GPU) ───────────────────────

const RAW_WAVES = [
  { dx: 0.6, dz: 0.8, freq: 1.2, amp: 1.0 },
  { dx: -0.4, dz: 0.9, freq: 2.5, amp: 0.4 },
  { dx: 0.9, dz: -0.3, freq: 3.8, amp: 0.2 },
  { dx: -0.7, dz: -0.6, freq: 5.0, amp: 0.1 },
];

export const WAVES = RAW_WAVES.map((w) => {
  const len = Math.sqrt(w.dx * w.dx + w.dz * w.dz);
  return { dx: w.dx / len, dz: w.dz / len, freq: w.freq, amp: w.amp };
});

// ── Module-level wave time — kept in sync by the mounted component ───────────

let waveTime = 0;

export function setWaveTime(t) {
  waveTime = t;
}

// ── CPU-side wave sampling (matches GPU shader exactly) ──────────────────────

export function sampleWaveHeight(x, z, waveHeight, choppiness, waveSpeed) {
  let y = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp } = WAVES[i];
    const a = amp * waveHeight;
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + waveTime * phase;
    y += a * Math.cos(theta);
  }
  return y;
}

export function sampleWaveNormal(x, z, waveHeight, choppiness, waveSpeed) {
  let nx = 0;
  let ny = 1;
  let nz = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp } = WAVES[i];
    const a = amp * waveHeight;
    const Q = choppiness / (freq * a * WAVES.length);
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + waveTime * phase;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const WA = freq * a;
    nx -= dx * WA * s;
    nz -= dz * WA * s;
    ny -= Q * WA * c;
  }
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}

// ── NURBS surface builders ───────────────────────────────────────────────────

function buildTopSurface(hw, hd, topY) {
  const knots = [0, 0, 0, 0, 1, 1, 1, 1];
  // u reversed (+hw → −hw) so cross(du,dv) faces +Y
  const xs = [hw, hw / 3, -hw / 3, -hw];
  const zs = [-hd, -hd / 3, hd / 3, hd];
  const cp = xs.map((x) => zs.map((z) => new THREE.Vector4(x, topY, z, 1)));
  return new NURBSSurface(3, 3, knots, knots, cp);
}

function buildBottomSurface(hw, hd, botY) {
  const knots = [0, 0, 0, 0, 1, 1, 1, 1];
  // Normal order so cross(du,dv) faces −Y
  const xs = [-hw, -hw / 3, hw / 3, hw];
  const zs = [-hd, -hd / 3, hd / 3, hd];
  const cp = xs.map((x) => zs.map((z) => new THREE.Vector4(x, botY, z, 1)));
  return new NURBSSurface(3, 3, knots, knots, cp);
}

function buildSideSurface(uVals, getPos, botY, topY) {
  // degree 3 (width, 4 CPs) × degree 2 (height, 3 CPs)
  const knotsU = [0, 0, 0, 0, 1, 1, 1, 1];
  const knotsV = [0, 0, 0, 1, 1, 1];
  const midY = (botY + topY) / 2;

  const cp = uVals.map((uVal) => {
    const b = getPos(uVal, botY);
    const t = getPos(uVal, topY);
    return [
      new THREE.Vector4(b.x, b.y, b.z, 1),
      new THREE.Vector4((b.x + t.x) / 2, midY, (b.z + t.z) / 2, 1),
      new THREE.Vector4(t.x, t.y, t.z, 1),
    ];
  });

  return new NURBSSurface(3, 2, knotsU, knotsV, cp);
}

export function buildAllSurfaces({ width, depth, height }) {
  const hw = width / 2;
  const hd = depth / 2;
  const topY = height / 2;
  const botY = -height / 2;

  return {
    top: buildTopSurface(hw, hd, topY),
    bottom: buildBottomSurface(hw, hd, botY),
    front: buildSideSurface(
      [-hw, -hw / 3, hw / 3, hw],
      (x, y) => ({ x, y, z: hd }),
      botY,
      topY
    ),
    back: buildSideSurface(
      [hw, hw / 3, -hw / 3, -hw],
      (x, y) => ({ x, y, z: -hd }),
      botY,
      topY
    ),
    right: buildSideSurface(
      [hd, hd / 3, -hd / 3, -hd],
      (z, y) => ({ x: hw, y, z }),
      botY,
      topY
    ),
    left: buildSideSurface(
      [-hd, -hd / 3, hd / 3, hd],
      (z, y) => ({ x: -hw, y, z }),
      botY,
      topY
    ),
  };
}

export function buildGeometries(surfaces, segments, height, maxDim) {
  const heightSegs = Math.max(8, Math.round(segments * (height / maxDim)));
  const lowSegs = Math.max(4, Math.round(segments / 4));
  const evalFn = (surface) => (u, v, target) => surface.getPoint(u, v, target);

  return [
    new ParametricGeometry(evalFn(surfaces.top), segments, segments),
    new ParametricGeometry(evalFn(surfaces.bottom), lowSegs, lowSegs),
    new ParametricGeometry(evalFn(surfaces.front), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.back), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.right), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.left), segments, heightSegs),
  ];
}
