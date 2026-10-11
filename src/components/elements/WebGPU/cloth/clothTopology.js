import { getShape } from './shapePresets';

// eslint-disable-next-line no-bitwise
function tatterHash(xi, yi, seed) {
  let h = (xi * 374761393 + yi * 668265263 + seed) | 0; // eslint-disable-line no-bitwise
  h = Math.imul(h ^ (h >>> 13), 1274126177); // eslint-disable-line no-bitwise
  h = Math.imul(h ^ (h >>> 16), 1262610899); // eslint-disable-line no-bitwise
  return ((h ^ (h >>> 13)) >>> 0) / 4294967295; // eslint-disable-line no-bitwise
}

function smootherstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise2D(px, py, seed) {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = smootherstep(px - ix);
  const fy = smootherstep(py - iy);
  const v00 = tatterHash(ix, iy, seed);
  const v10 = tatterHash(ix + 1, iy, seed);
  const v01 = tatterHash(ix, iy + 1, seed);
  const v11 = tatterHash(ix + 1, iy + 1, seed);
  return (
    v00 +
    (v10 - v00) * fx +
    (v01 - v00) * fy +
    (v00 - v10 - v01 + v11) * fx * fy
  );
}

export function fbm2D(px, py, seed, octaves = 3) {
  let value = 0;
  let amp = 1;
  let freq = 1;
  let total = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise2D(px * freq, py * freq, seed + i * 31) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / total;
}

export const NUM_ANCHORS = 11;

// The CPU half of the cloth: the verlet grid, its springs, anchor tags and
// the render quads. Both the GPU sim and its CPU mirror are built from this,
// so the two can never disagree about what cloth they are simulating.
export function buildClothTopology({
  width = 1.0,
  height = 0.7,
  segmentsX = 30,
  segmentsY = 21,
  pins = [],
  centered = false,
  orientation = 'vertical',
  origin = [0, 0, 0],
  shape = 'rectangle',
  anchors = [],
}) {
  const [ox, oy, oz] = origin;
  const pinSet = new Set(pins);
  const horiz = orientation === 'horizontal';
  const xOffset = centered ? -width * 0.5 : 0;
  const yOffset = horiz && centered ? -height * 0.5 : 0;
  const shapeFn = getShape(shape);
  const vCount = (segmentsX + 1) * (segmentsY + 1);
  const idAt = (x, y) => x * (segmentsY + 1) + y;

  const rest = new Float64Array(vCount * 3);
  const shapeDistArr = new Float32Array(vCount);
  const outsideSet = new Set();
  const fixed = new Uint8Array(vCount);

  for (let x = 0; x <= segmentsX; x += 1) {
    for (let y = 0; y <= segmentsY; y += 1) {
      const id = idAt(x, y);
      rest[id * 3] = ox + x * (width / segmentsX) + xOffset;
      rest[id * 3 + 1] = horiz ? oy : oy - y * (height / segmentsY);
      rest[id * 3 + 2] = horiz ? oz + y * (height / segmentsY) + yOffset : oz;
      const sd = shapeFn(x / segmentsX, y / segmentsY);
      shapeDistArr[id] = sd;
      if (sd < 0) outsideSet.add(id);
      fixed[id] = pinSet.has(id) || sd < 0 ? 1 : 0;
    }
  }

  // Springs touching an outside vertex are skipped so the fixed outside
  // vertices don't anchor the cloth body.
  const springPairs = [];
  const springIdsOf = Array.from({ length: vCount }, () => []);
  const addSpring = (a, b) => {
    springIdsOf[a].push(springPairs.length / 2);
    springIdsOf[b].push(springPairs.length / 2);
    springPairs.push(a, b);
  };
  for (let x = 0; x <= segmentsX; x += 1) {
    for (let y = 0; y <= segmentsY; y += 1) {
      const v0 = idAt(x, y);
      if (!outsideSet.has(v0)) {
        if (x > 0 && !outsideSet.has(idAt(x - 1, y)))
          addSpring(v0, idAt(x - 1, y));
        if (y > 0 && !outsideSet.has(idAt(x, y - 1)))
          addSpring(v0, idAt(x, y - 1));
        if (x > 0 && y > 0 && !outsideSet.has(idAt(x - 1, y - 1)))
          addSpring(v0, idAt(x - 1, y - 1));
        if (x > 0 && y < segmentsY && !outsideSet.has(idAt(x - 1, y + 1)))
          addSpring(v0, idAt(x - 1, y + 1));
      }
    }
  }

  const posArr = new Float32Array(rest);
  // paramsArr.x: 0 = free, 1 = static pin, 2+ = anchor slot.
  const paramsArr = new Uint32Array(vCount * 3);
  const springList = [];
  for (let i = 0; i < vCount; i += 1) {
    paramsArr[i * 3] = fixed[i];
    if (!fixed[i]) {
      paramsArr[i * 3 + 1] = springIdsOf[i].length;
      paramsArr[i * 3 + 2] = springList.length;
      springList.push(...springIdsOf[i]);
    }
  }

  const anchorOffsetArr = new Float32Array(vCount * 3);
  const cellW = width / segmentsX;
  const cellH = height / segmentsY;
  for (let a = 0; a < Math.min(anchors.length, NUM_ANCHORS); a += 1) {
    const anch = anchors[a];
    const gxCenter = Math.round((anch.worldX - ox - xOffset) / cellW);
    const gyCenter = horiz
      ? Math.round((anch.worldZ - oz - yOffset) / cellH)
      : Math.round((oy - anch.worldZ) / cellH);
    const r = anch.gridRadius ?? 2;
    for (let dx = -r; dx <= r; dx += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        const gx = gxCenter + dx;
        const gy = gyCenter + dy;
        if (
          gx >= 0 &&
          gx <= segmentsX &&
          gy >= 0 &&
          gy <= segmentsY &&
          dx * dx + dy * dy <= r * r
        ) {
          const id = idAt(gx, gy);
          if (!outsideSet.has(id) && !pinSet.has(id)) {
            paramsArr[id * 3] = 2 + a;
            anchorOffsetArr[id * 3] = rest[id * 3] - anch.restX;
            anchorOffsetArr[id * 3 + 1] = rest[id * 3 + 1] - anch.restY;
            anchorOffsetArr[id * 3 + 2] = rest[id * 3 + 2] - anch.restZ;
          }
        }
      }
    }
  }

  const sCount = springPairs.length / 2;
  const springVtxIds = new Uint32Array(springPairs);
  const springRestLen = new Float32Array(sCount);
  for (let i = 0; i < sCount; i += 1) {
    const a = springPairs[i * 2] * 3;
    const b = springPairs[i * 2 + 1] * 3;
    const dx = rest[b] - rest[a];
    const dy = rest[b + 1] - rest[a + 1];
    const dz = rest[b + 2] - rest[a + 2];
    springRestLen[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const edgeAllPinned = (count, idOf) => {
    for (let i = 0; i <= count; i += 1) if (!pinSet.has(idOf(i))) return false;
    return true;
  };
  const edgePinned = {
    left: edgeAllPinned(segmentsY, (y) => idAt(0, y)),
    right: edgeAllPinned(segmentsY, (y) => idAt(segmentsX, y)),
    top: edgeAllPinned(segmentsX, (x) => idAt(x, 0)),
    bottom: edgeAllPinned(segmentsX, (x) => idAt(x, segmentsY)),
  };

  // Render vertices sit at quad centres: each averages its quad's four sim
  // corners, so the mesh grid is segmentsX × segmentsY.
  const meshVCount = segmentsX * segmentsY;
  const meshIdx = (gx, gy) => gy * segmentsX + gx;
  const vtxIdArr = new Uint32Array(meshVCount * 4);
  const uvArr = new Float32Array(meshVCount * 2);
  const quadDead = new Uint8Array(meshVCount);
  for (let x = 0; x < segmentsX; x += 1) {
    for (let y = 0; y < segmentsY; y += 1) {
      const idx = meshIdx(x, y);
      const corners = [
        idAt(x, y),
        idAt(x + 1, y),
        idAt(x, y + 1),
        idAt(x + 1, y + 1),
      ];
      vtxIdArr.set(corners, idx * 4);
      uvArr[idx * 2] = (x + 0.5) / segmentsX;
      uvArr[idx * 2 + 1] = 1 - (y + 0.5) / segmentsY;
      quadDead[idx] = corners.some((c) => shapeDistArr[c] < 0) ? 1 : 0;
    }
  }

  const triangleAlive = (a, b, c) =>
    !quadDead[a] && !quadDead[b] && !quadDead[c];

  // Triangles A (x,y)→(x-1,y)→(x-1,y-1) and B (x,y)→(x-1,y-1)→(x,y-1) per
  // cell; that winding is what makes the outer side back-facing.
  const buildIndices = (target = new Uint32Array(meshVCount * 6)) => {
    let count = 0;
    for (let x = 1; x < segmentsX; x += 1) {
      for (let y = 1; y < segmentsY; y += 1) {
        const q00 = meshIdx(x, y);
        const q10 = meshIdx(x - 1, y);
        const q11 = meshIdx(x - 1, y - 1);
        const q01 = meshIdx(x, y - 1);
        if (triangleAlive(q00, q10, q11)) {
          target.set([q00, q10, q11], count);
          count += 3;
        }
        if (triangleAlive(q00, q11, q01)) {
          target.set([q00, q11, q01], count);
          count += 3;
        }
      }
    }
    return { count, indices: target };
  };

  return {
    anchorOffsetArr,
    buildIndices,
    edgePinned,
    height,
    idAt,
    meshIdx,
    meshVCount,
    outsideSet,
    paramsArr,
    pinSet,
    posArr,
    quadDead,
    rest,
    sCount,
    segmentsX,
    segmentsY,
    shapeDistArr,
    springList: new Uint32Array(springList),
    springRestLen,
    springVtxIds,
    triangleAlive,
    uvArr,
    vCount,
    vtxIdArr,
    width,
  };
}

// Per-vertex alpha from shape edge fade, noise holes and tattered free edges.
// `alpha` drives physics (killed vertices let colliders pass); `render` is
// what the shader shows, which in smoothEdges mode omits the binary kill so
// per-pixel noise alone defines the boundary.
export function computeClothAlpha(
  topology,
  {
    seed = 42,
    scale = 3,
    edgeFade = 0,
    holeAmount = 0,
    tatterEdge = 0,
    smoothEdges = false,
  } = {}
) {
  const { edgePinned, idAt, segmentsX, segmentsY, shapeDistArr, vCount } =
    topology;
  const alpha = new Float32Array(vCount);
  const render = new Float32Array(vCount);
  const tatterDepth = tatterEdge * 0.5;
  const needsNoise = holeAmount > 0 || tatterEdge > 0;

  for (let x = 0; x <= segmentsX; x += 1) {
    for (let y = 0; y <= segmentsY; y += 1) {
      const vid = idAt(x, y);
      const u = x / segmentsX;
      const v = y / segmentsY;
      const noise = needsNoise ? fbm2D(u * scale, v * scale, seed) : 0;
      let softA = 1;
      let killed = 0;

      if (edgeFade > 0) {
        const sd = shapeDistArr[vid];
        if (sd < edgeFade) softA *= Math.max(0, sd / edgeFade);
      }

      if (tatterEdge > 0 && tatterDepth > 0) {
        const dists = [];
        if (!edgePinned.left) dists.push(u);
        if (!edgePinned.right) dists.push(1 - u);
        if (!edgePinned.top) dists.push(v);
        if (!edgePinned.bottom) dists.push(1 - v);
        const minFreeDist = dists.length > 0 ? Math.min(...dists) : 1;
        if (minFreeDist < tatterDepth) {
          const t = minFreeDist / tatterDepth;
          if (noise < 0.7 - t * 0.65) killed = 1;
        }
      }

      if (holeAmount > 0 && noise > 1 - holeAmount * 0.4) killed = 1;

      const visible = killed ? 0 : softA;
      alpha[vid] = visible;
      render[vid] = smoothEdges ? softA : visible;
    }
  }
  return { alpha, render };
}
