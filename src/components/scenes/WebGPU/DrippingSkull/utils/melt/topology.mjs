const RIM_RINGS = 4;

// 0 on open boundaries (Suzanne's eye rims), rising to 1 over RIM_RINGS edge rings; 1 everywhere on closed shapes.
export function rimWeights({ nv, offsets, neighbours, boundary }) {
  const rim = new Float32Array(nv).fill(1);
  let front = [];
  for (let i = 0; i < nv; i++) if (boundary[i]) ((rim[i] = 0), front.push(i));
  for (let ring = 1; ring < RIM_RINGS && front.length; ring++) {
    const next = [];
    for (const i of front)
      for (let k = offsets[i]; k < offsets[i + 1]; k++) {
        const j = neighbours[k];
        if (rim[j] === 1) ((rim[j] = ring / RIM_RINGS), next.push(j));
      }
    front = next;
  }
  return rim;
}

const FADE_WIDTH = 0.06;

// Displacement weight for rendering: rises from 0 on open boundaries over FADE_WIDTH of surface distance, so bulges
// ease out wide enough not to fold; 1 everywhere on closed shapes.
export function boundaryFade({ nv, offsets, neighbours, boundary }, pos) {
  const d = new Float64Array(nv).fill(FADE_WIDTH);
  let any = false;
  for (let i = 0; i < nv; i++) if (boundary[i]) ((d[i] = 0), (any = true));
  for (let changed = any; changed; ) {
    changed = false;
    for (let i = 0; i < nv; i++) {
      if (d[i] >= FADE_WIDTH) continue;
      for (let k = offsets[i]; k < offsets[i + 1]; k++) {
        const j = neighbours[k];
        const e =
          d[i] +
          Math.hypot(
            pos[j * 3] - pos[i * 3],
            pos[j * 3 + 1] - pos[i * 3 + 1],
            pos[j * 3 + 2] - pos[i * 3 + 2]
          );
        if (e < d[j]) ((d[j] = e), (changed = true));
      }
    }
  }
  for (let i = 0; i < nv; i++) {
    const t = d[i] / FADE_WIDTH;
    d[i] = t * t * (3 - 2 * t);
  }
  return new Float32Array(d);
}

// CSR one-ring with clamped cotangent weights, barycentric vertex areas, rest face normals, boundary flags and
// vertex-to-face CSR.
export function buildTopology(geometry) {
  const pos = geometry.attributes.position.array;
  const index = geometry.index.array;
  const nv = pos.length / 3;
  const nf = index.length / 3;

  const areas = new Float32Array(nv);
  const faceNormals = new Float32Array(nf * 3);
  // Open-addressed edge table; edge ids follow first occurrence.
  let cap = 2;
  while (cap < nf * 6) cap <<= 1;
  const slotA = new Int32Array(cap).fill(-1),
    slotB = new Int32Array(cap),
    slotId = new Int32Array(cap);
  const eA = new Int32Array(nf * 3),
    eB = new Int32Array(nf * 3),
    eW = new Float64Array(nf * 3),
    eUse = new Uint8Array(nf * 3);
  let ne = 0;
  const edgeId = (a, b) => {
    if (a > b) {
      const t = a;
      ((a = b), (b = t));
    }
    let h = (Math.imul(a, 0x9e3779b1) ^ Math.imul(b, 0x85ebca77)) & (cap - 1);
    for (;;) {
      if (slotA[h] === -1) {
        ((slotA[h] = a),
          (slotB[h] = b),
          (slotId[h] = ne),
          (eA[ne] = a),
          (eB[ne] = b));
        return ne++;
      }
      if (slotA[h] === a && slotB[h] === b) return slotId[h];
      h = (h + 1) & (cap - 1);
    }
  };
  const v = [0, 0, 0],
    px = [0, 0, 0],
    py = [0, 0, 0],
    pz = [0, 0, 0];
  for (let f = 0; f < nf; f++) {
    for (let k = 0; k < 3; k++) {
      const i = (v[k] = index[f * 3 + k]);
      ((px[k] = pos[i * 3]),
        (py[k] = pos[i * 3 + 1]),
        (pz[k] = pos[i * 3 + 2]));
    }
    const ux = px[1] - px[0],
      uy = py[1] - py[0],
      uz = pz[1] - pz[0];
    const wx = px[2] - px[0],
      wy = py[2] - py[0],
      wz = pz[2] - pz[0];
    const cx = uy * wz - uz * wy,
      cy = uz * wx - ux * wz,
      cz = ux * wy - uy * wx;
    const len = Math.hypot(cx, cy, cz);
    const area = 0.5 * len;
    faceNormals[f * 3] = len > 0 ? cx / len : 0;
    faceNormals[f * 3 + 1] = len > 0 ? cy / len : 0;
    faceNormals[f * 3 + 2] = len > 0 ? cz / len : 0;
    for (let k = 0; k < 3; k++) areas[v[k]] += area / 3;
    for (let k = 0; k < 3; k++) {
      // The angle at corner k weights the opposite edge.
      const k1 = (k + 1) % 3,
        k2 = (k + 2) % 3;
      const ax = px[k1] - px[k],
        ay = py[k1] - py[k],
        az = pz[k1] - pz[k];
      const bx = px[k2] - px[k],
        by = py[k2] - py[k],
        bz = pz[k2] - pz[k];
      const rx = ay * bz - az * by,
        ry = az * bx - ax * bz,
        rz = ax * by - ay * bx;
      const cot =
        (ax * bx + ay * by + az * bz) / Math.max(Math.hypot(rx, ry, rz), 1e-12);
      const e = edgeId(v[k1], v[k2]);
      eW[e] += 0.5 * cot;
      eUse[e]++;
    }
  }

  const degree = new Uint32Array(nv);
  for (let e = 0; e < ne; e++) (degree[eA[e]]++, degree[eB[e]]++);
  const offsets = new Uint32Array(nv + 1);
  for (let i = 0; i < nv; i++) offsets[i + 1] = offsets[i] + degree[i];
  const neighbours = new Uint32Array(offsets[nv]);
  const weights = new Float32Array(offsets[nv]);
  const fill = offsets.slice(0, nv);
  const boundary = new Uint8Array(nv);
  for (let e = 0; e < ne; e++) {
    const a = eA[e],
      b = eB[e];
    const cw = Math.max(eW[e], 0.05);
    neighbours[fill[a]] = b;
    weights[fill[a]++] = cw;
    neighbours[fill[b]] = a;
    weights[fill[b]++] = cw;
    if (eUse[e] !== 2) boundary[a] = boundary[b] = 1;
  }

  const vfOffsets = new Uint32Array(nv + 1);
  for (let i = 0; i < index.length; i++) vfOffsets[index[i] + 1]++;
  for (let i = 0; i < nv; i++) vfOffsets[i + 1] += vfOffsets[i];
  const vfFaces = new Uint32Array(index.length);
  const vfFill = vfOffsets.slice(0, nv);
  for (let i = 0; i < index.length; i++)
    vfFaces[vfFill[index[i]]++] = (i / 3) | 0;

  return {
    nv,
    nf,
    offsets,
    neighbours,
    weights,
    areas,
    index,
    faceNormals,
    boundary,
    vfOffsets,
    vfFaces,
  };
}
