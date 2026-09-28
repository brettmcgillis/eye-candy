/* eslint-disable no-continue, no-param-reassign */
// The one mechanism the planar reference lacks: keeping a curve on a surface.
// Points move to the closest point on the mesh's triangles, and the normal
// there (interpolated from the vertices, so it turns smoothly) is what
// "sideways" is measured against. Snapping to the nearest vertex's tangent
// plane instead made points jump whenever the nearest vertex changed, and
// those jumps fed back through splitting into runaway growth.
//
// Triangles facing away from the point's current normal are skipped, or a
// point beside thin bone snaps to the far face of it. The bar is "not
// opposite" rather than "the same way", so a point can still turn a sharp
// edge like the rim of the jaw.
//
// Points barely move per step, so each remembers its triangle (`n.t`) and
// searches only the triangles around it, walking on while a neighbour is
// closer; the grid is the fallback for a point with no triangle yet.

function closestOnTriangle(px, py, pz, P, a, b, c, out) {
  const ax = P[a * 3];
  const ay = P[a * 3 + 1];
  const az = P[a * 3 + 2];
  const abx = P[b * 3] - ax;
  const aby = P[b * 3 + 1] - ay;
  const abz = P[b * 3 + 2] - az;
  const acx = P[c * 3] - ax;
  const acy = P[c * 3 + 1] - ay;
  const acz = P[c * 3 + 2] - az;
  const apx = px - ax;
  const apy = py - ay;
  const apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz;
  const d2 = acx * apx + acy * apy + acz * apz;
  const bpx = px - P[b * 3];
  const bpy = py - P[b * 3 + 1];
  const bpz = pz - P[b * 3 + 2];
  const d3 = abx * bpx + aby * bpy + abz * bpz;
  const d4 = acx * bpx + acy * bpy + acz * bpz;
  const cpx = px - P[c * 3];
  const cpy = py - P[c * 3 + 1];
  const cpz = pz - P[c * 3 + 2];
  const d5 = abx * cpx + aby * cpy + abz * cpz;
  const d6 = acx * cpx + acy * cpy + acz * cpz;
  let v = 0;
  let w = 0;
  const vc = d1 * d4 - d3 * d2;
  const vb = d5 * d2 - d1 * d6;
  const va = d3 * d6 - d5 * d4;
  if (d1 <= 0 && d2 <= 0) {
    v = 0;
    w = 0;
  } else if (d3 >= 0 && d4 <= d3) {
    v = 1;
    w = 0;
  } else if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    v = d1 / (d1 - d3);
    w = 0;
  } else if (d6 >= 0 && d5 <= d6) {
    v = 0;
    w = 1;
  } else if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    v = 0;
    w = d2 / (d2 - d6);
  } else if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    v = 1 - w;
  } else {
    const denom = 1 / (va + vb + vc);
    v = vb * denom;
    w = vc * denom;
  }
  out.u = 1 - v - w;
  out.v = v;
  out.w = w;
  out.x = ax + abx * v + acx * w;
  out.y = ay + aby * v + acy * w;
  out.z = az + abz * v + acz * w;
}

export default function createSurfaceProjector({
  normals,
  positions,
  spacing,
  triangles,
}) {
  const P = positions;
  const N = normals;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < P.length; i += 3) {
    minX = Math.min(minX, P[i]);
    minY = Math.min(minY, P[i + 1]);
    minZ = Math.min(minZ, P[i + 2]);
    maxX = Math.max(maxX, P[i]);
    maxY = Math.max(maxY, P[i + 1]);
    maxZ = Math.max(maxZ, P[i + 2]);
  }
  const inv = 1 / spacing;
  const nx = Math.floor((maxX - minX) * inv) + 1;
  const ny = Math.floor((maxY - minY) * inv) + 1;
  const nz = Math.floor((maxZ - minZ) * inv) + 1;
  const cellOf = (x, y, z) => x + y * nx + z * nx * ny;

  // Each triangle is filed under every cell its bounds touch, so a point
  // only has to look in its own cell.
  const lists = new Map();
  const triCount = triangles.length / 3;
  for (let t = 0; t < triCount; t += 1) {
    const [a, b, c] = [
      triangles[t * 3],
      triangles[t * 3 + 1],
      triangles[t * 3 + 2],
    ];
    const lo = [0, 1, 2].map((k) =>
      Math.floor(
        (Math.min(P[a * 3 + k], P[b * 3 + k], P[c * 3 + k]) -
          [minX, minY, minZ][k]) *
          inv
      )
    );
    const hi = [0, 1, 2].map((k) =>
      Math.floor(
        (Math.max(P[a * 3 + k], P[b * 3 + k], P[c * 3 + k]) -
          [minX, minY, minZ][k]) *
          inv
      )
    );
    for (let z = lo[2]; z <= hi[2]; z += 1) {
      for (let y = lo[1]; y <= hi[1]; y += 1) {
        for (let x = lo[0]; x <= hi[0]; x += 1) {
          const key = cellOf(x, y, z);
          const list = lists.get(key);
          if (list) list.push(t);
          else lists.set(key, [t]);
        }
      }
    }
  }

  const vertexCount = P.length / 3;
  const ringStart = new Int32Array(vertexCount + 1);
  for (let k = 0; k < triangles.length; k += 1)
    ringStart[triangles[k] + 1] += 1;
  for (let v = 0; v < vertexCount; v += 1) ringStart[v + 1] += ringStart[v];
  const ringFill = ringStart.slice(0, vertexCount);
  const ringTris = new Int32Array(triangles.length);
  for (let k = 0; k < triangles.length; k += 1) {
    ringTris[ringFill[triangles[k]]] = Math.floor(k / 3);
    ringFill[triangles[k]] += 1;
  }

  const trust = spacing * 0.5;
  let calls = 0;
  const hit = { u: 0, v: 0, w: 0, x: 0, y: 0, z: 0 };
  const best = { d: Infinity, t: -1, u: 0, v: 0, w: 0, x: 0, y: 0, z: 0 };

  const consider = (t, px, py, pz, hx, hy, hz, hinted) => {
    const a = triangles[t * 3];
    const b = triangles[t * 3 + 1];
    const c = triangles[t * 3 + 2];
    if (hinted) {
      const fx = N[a * 3] + N[b * 3] + N[c * 3];
      const fy = N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1];
      const fz = N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2];
      const fl = Math.hypot(fx, fy, fz) || 1;
      if ((fx * hx + fy * hy + fz * hz) / fl < -0.3) return;
    }
    closestOnTriangle(px, py, pz, P, a, b, c, hit);
    const d =
      (hit.x - px) * (hit.x - px) +
      (hit.y - py) * (hit.y - py) +
      (hit.z - pz) * (hit.z - pz);
    if (d < best.d) {
      best.d = d;
      best.t = t;
      best.u = hit.u;
      best.v = hit.v;
      best.w = hit.w;
      best.x = hit.x;
      best.y = hit.y;
      best.z = hit.z;
    }
  };

  const search = (px, py, pz, hx, hy, hz, ring) => {
    const hinted = hx * hx + hy * hy + hz * hz > 0.25;
    const cx = Math.floor((px - minX) * inv);
    const cy = Math.floor((py - minY) * inv);
    const cz = Math.floor((pz - minZ) * inv);
    for (
      let z = Math.max(cz - ring, 0);
      z <= Math.min(cz + ring, nz - 1);
      z += 1
    ) {
      for (
        let y = Math.max(cy - ring, 0);
        y <= Math.min(cy + ring, ny - 1);
        y += 1
      ) {
        for (
          let x = Math.max(cx - ring, 0);
          x <= Math.min(cx + ring, nx - 1);
          x += 1
        ) {
          const list = lists.get(cellOf(x, y, z));
          if (!list) continue;
          for (let k = 0; k < list.length; k += 1) {
            consider(list[k], px, py, pz, hx, hy, hz, hinted);
          }
        }
      }
    }
  };

  // Moves `p` ({x, y, z}) onto the surface and writes the normal there into
  // `n`, whose current value is the facing to keep.
  return (p, n) => {
    best.d = Infinity;
    best.t = -1;
    const hinted = n.x * n.x + n.y * n.y + n.z * n.z > 0.25;
    let from = n.t ?? -1;
    for (let hop = 0; from >= 0 && hop < 6; hop += 1) {
      const start = best.t;
      for (let corner = 0; corner < 3; corner += 1) {
        const v = triangles[from * 3 + corner];
        for (let r = ringStart[v]; r < ringStart[v + 1]; r += 1) {
          consider(ringTris[r], p.x, p.y, p.z, n.x, n.y, n.z, hinted);
        }
      }
      if (best.t === start || best.t === from) break;
      from = best.t;
    }
    // The walk only follows connected triangles, and the skull is dozens of
    // separate bones: without the own-cell grid check a curve that starts on
    // the mandible could never cross onto the teeth or the cranium.
    // Crossing only needs an occasional chance, so the check runs on one
    // projection in four.
    calls += 1;
    if (best.t < 0 || calls % 4 === 0) search(p.x, p.y, p.z, n.x, n.y, n.z, 0);
    // A walk can stop in a local minimum on a fold; after a tangent move a
    // point is nearly on the surface, so anything farther gets the wider
    // grid search.
    if (best.t < 0 || best.d > trust * trust) {
      // The own-cell answer is only certain if it is nearer than the cell's
      // walls; otherwise a closer triangle may be filed next door.
      const wall =
        Math.min(
          (p.x - minX) * inv - Math.floor((p.x - minX) * inv),
          (p.y - minY) * inv - Math.floor((p.y - minY) * inv),
          (p.z - minZ) * inv - Math.floor((p.z - minZ) * inv),
          Math.ceil((p.x - minX) * inv) - (p.x - minX) * inv,
          Math.ceil((p.y - minY) * inv) - (p.y - minY) * inv,
          Math.ceil((p.z - minZ) * inv) - (p.z - minZ) * inv
        ) * spacing;
      for (
        let ring = 1, sure = wall;
        (best.t < 0 || best.d > sure * sure) && ring <= 4;
        ring *= 2
      ) {
        search(p.x, p.y, p.z, n.x, n.y, n.z, ring);
        sure = wall + ring * spacing;
      }
    }
    if (best.t < 0) return;
    n.t = best.t;
    const a = triangles[best.t * 3];
    const b = triangles[best.t * 3 + 1];
    const c = triangles[best.t * 3 + 2];
    const mx = N[a * 3] * best.u + N[b * 3] * best.v + N[c * 3] * best.w;
    const my =
      N[a * 3 + 1] * best.u + N[b * 3 + 1] * best.v + N[c * 3 + 1] * best.w;
    const mz =
      N[a * 3 + 2] * best.u + N[b * 3 + 2] * best.v + N[c * 3 + 2] * best.w;
    const ml = Math.hypot(mx, my, mz) || 1;
    p.x = best.x;
    p.y = best.y;
    p.z = best.z;
    n.x = mx / ml;
    n.y = my / ml;
    n.z = mz / ml;
  };
}
