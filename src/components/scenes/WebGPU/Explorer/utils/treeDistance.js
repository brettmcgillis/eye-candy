// CPU mirror of `apollianTree` in `@modules/sdf`. The agent steers by probing
// the distance field, and there is no way to read the GPU's copy back cheaply
// enough to do that per frame — so the fold is written twice. Both copies take
// the same control values and must stay identical: if the sphere starts
// clipping through branches, this drifted from the TSL version.

// Mirrors MIN_RADIUS_SQ in `@modules/sdf` — see the note there.
const MIN_RADIUS_SQ = 1e-12;

function fold1(p, size) {
  const half = size * 0.5;
  return ((((p + half) % size) + size) % size) - half;
}

function floorMod(a, b) {
  return ((a % b) + b) % b;
}

function foldMirror2(x, y, size) {
  const half = size * 0.5;
  const mirrorX = floorMod(Math.floor((x + half) / size), 2) * 2 - 1;
  const mirrorY = floorMod(Math.floor((y + half) / size), 2) * 2 - 1;
  return [fold1(x, size) * mirrorX, fold1(y, size) * mirrorY];
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function sdBox(px, py, pz, bx, by, bz) {
  const qx = Math.abs(px) - bx;
  const qy = Math.abs(py) - by;
  const qz = Math.abs(pz) - bz;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
}

export function treeDistance(px, py, pz, o) {
  let x = px;
  let y = py;
  let z = pz;

  const s = o.scaleBase + smoothstep(0.15, 1.5, py) * o.scaleGain;
  const cos = Math.cos(o.twist);
  const sin = Math.sin(o.twist);
  let scale = 1;

  for (let i = 0; i < o.folds; i += 1) {
    y = fold1(y, o.periodY);
    const [fx, fz] = foldMirror2(x, z, o.periodXZ);
    x = cos * fx + sin * fz;
    z = -sin * fx + cos * fz;

    const k = s / Math.max(x * x + y * y + z * z, MIN_RADIUS_SQ);
    x *= k;
    y *= k;
    z *= k;
    scale *= k;
  }

  const d = sdBox(x - 0.1, y - 0.1, z - 0.1, 1, 2, 1) - 0.5;
  return ((Math.abs(d) - 0.01) * 0.25) / scale;
}

export function treeGradient(px, py, pz, o, out, epsilon = 0.002) {
  const e = epsilon;
  out.set(
    treeDistance(px + e, py, pz, o) - treeDistance(px - e, py, pz, o),
    treeDistance(px, py + e, pz, o) - treeDistance(px, py - e, pz, o),
    treeDistance(px, py, pz + e, o) - treeDistance(px, py, pz - e, o)
  );
  return out.normalize();
}
