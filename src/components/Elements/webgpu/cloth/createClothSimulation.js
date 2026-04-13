import {
  Fn,
  If,
  Loop,
  Return,
  attribute,
  cross,
  instanceIndex,
  instancedArray,
  select,
  time,
  transformNormalToView,
  triNoise3D,
  uint,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// ── CPU-side value noise for tatter face removal ──

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

function fbm2D(px, py, seed, octaves = 3) {
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

/**
 * Creates a GPU-accelerated cloth simulation using verlet integration
 * with spring-mass system and WebGPU compute shaders.
 *
 * @param {Object} config
 * @param {number}  config.width         - Cloth width
 * @param {number}  config.height        - Cloth height (or length for ribbons)
 * @param {number}  config.segmentsX     - Horizontal segments
 * @param {number}  config.segmentsY     - Vertical segments
 * @param {'left'|'top'} config.pinEdge  - Fixed edge ('left' column or 'top' row)
 * @param {number[]} config.origin       - [x, y, z] grid origin
 * @param {number}  config.gravity       - Gravity force per step
 * @param {number}  config.windFrequency - triNoise3D frequency
 * @param {number}  config.windAmplitude - Wind noise multiplier
 * @param {Object}  [config.tatter]        - Tatter noise params for edges/holes
 * @param {number}  [config.tatter.seed]    - Noise seed (default: 42)
 * @param {number}  [config.tatter.scale]   - Noise frequency (default: 3)
 * @param {number}  [config.tatter.edge]    - Edge tatter 0–1 (default: 0)
 * @param {number}  [config.tatter.holes]   - Interior holes 0–1 (default: 0)
 * @param {THREE.Material} config.material - Material to configure positionNode on
 */
export default function createClothSimulation({
  width = 1.0,
  height = 0.7,
  segmentsX = 30,
  segmentsY = 21,
  pinEdge = 'left',
  origin = [0, 0, 0],
  gravity = 0.00005,
  windFrequency = 1,
  windAmplitude = 0.0001,
  tatter = {},
  material,
}) {
  // ── Verlet topology ──
  const vertices = [];
  const springs = [];
  const columns = [];
  const [ox, oy, oz] = origin;

  const addVertex = (x, y, z, isFixed) => {
    const id = vertices.length;
    const v = {
      id,
      position: new THREE.Vector3(x, y, z),
      isFixed,
      springIds: [],
    };
    vertices.push(v);
    return v;
  };

  const addSpring = (v0, v1) => {
    const id = springs.length;
    v0.springIds.push(id);
    v1.springIds.push(id);
    springs.push({ id, vertex0: v0, vertex1: v1 });
  };

  // Build vertex grid — layout depends on pinEdge
  for (let x = 0; x <= segmentsX; x += 1) {
    const col = [];
    for (let y = 0; y <= segmentsY; y += 1) {
      let px;
      let isFixed;
      if (pinEdge === 'top') {
        px = ox + x * (width / segmentsX) - width * 0.5;
        isFixed = y === 0;
      } else {
        px = ox + x * (width / segmentsX);
        isFixed = x === 0;
      }
      const py = oy - y * (height / segmentsY);
      col.push(addVertex(px, py, oz, isFixed));
    }
    columns.push(col);
  }

  // Structural + shear springs
  for (let x = 0; x <= segmentsX; x += 1) {
    for (let y = 0; y <= segmentsY; y += 1) {
      const v0 = columns[x][y];
      if (x > 0) addSpring(v0, columns[x - 1][y]);
      if (y > 0) addSpring(v0, columns[x][y - 1]);
      if (x > 0 && y > 0) addSpring(v0, columns[x - 1][y - 1]);
      if (x > 0 && y < segmentsY) addSpring(v0, columns[x - 1][y + 1]);
    }
  }

  // ── Vertex storage buffers ──
  const vCount = vertices.length;
  const springListArr = [];
  const posArr = new Float32Array(vCount * 3);
  const paramsArr = new Uint32Array(vCount * 3);

  for (let i = 0; i < vCount; i += 1) {
    const v = vertices[i];
    posArr[i * 3] = v.position.x;
    posArr[i * 3 + 1] = v.position.y;
    posArr[i * 3 + 2] = v.position.z;
    paramsArr[i * 3] = v.isFixed ? 1 : 0;
    if (!v.isFixed) {
      paramsArr[i * 3 + 1] = v.springIds.length;
      paramsArr[i * 3 + 2] = springListArr.length;
      springListArr.push(...v.springIds);
    }
  }

  const posBuf = instancedArray(posArr, 'vec3').setPBO(true);
  const forceBuf = instancedArray(vCount, 'vec3');
  const paramsBuf = instancedArray(paramsArr, 'uvec3');
  const springListBuf = instancedArray(
    new Uint32Array(springListArr),
    'uint'
  ).setPBO(true);

  // ── Spring storage buffers ──
  const sCount = springs.length;
  const sVtxIds = new Uint32Array(sCount * 2);
  const sRestLen = new Float32Array(sCount);

  for (let i = 0; i < sCount; i += 1) {
    const s = springs[i];
    sVtxIds[i * 2] = s.vertex0.id;
    sVtxIds[i * 2 + 1] = s.vertex1.id;
    sRestLen[i] = s.vertex0.position.distanceTo(s.vertex1.position);
  }

  const springVtxIdBuf = instancedArray(sVtxIds, 'uvec2').setPBO(true);
  const springRestLenBuf = instancedArray(sRestLen, 'float');
  const springForceBuf = instancedArray(sCount * 3, 'vec3').setPBO(true);

  // ── Uniforms ──
  const dampeningU = uniform(0.99);
  const spherePosU = uniform(new THREE.Vector3(10, 10, 10));
  const sphereU = uniform(0.0);
  const sphereRadiusU = uniform(0.12);
  const windU = uniform(1.0);
  const windDirU = uniform(new THREE.Vector3(1, 0, 0));
  const stiffnessU = uniform(0.2);
  const maxVelocityU = uniform(0.01);

  // Per-vertex active mask — 0 for orphaned (all faces removed), 1 otherwise.
  // Sphere collision force is multiplied by this so the cursor passes through holes.
  const activeArr = new Float32Array(vCount).fill(1);
  const activeBuf = instancedArray(activeArr, 'float');

  // ── Compute shader 1 — spring forces ──
  const computeSprings = Fn(() => {
    // Guard against out-of-bounds workgroup threads
    If(instanceIndex.greaterThanEqual(uint(sCount)), () => Return());

    const vtxIds = springVtxIdBuf.element(instanceIndex);
    const restLen = springRestLenBuf.element(instanceIndex);
    const p0 = posBuf.element(vtxIds.x);
    const p1 = posBuf.element(vtxIds.y);
    const delta = p1.sub(p0).toVar();
    const dist = delta.length().max(0.000001).toVar();
    const force = dist
      .sub(restLen)
      .mul(stiffnessU)
      .mul(delta)
      .mul(0.5)
      .div(dist);
    springForceBuf.element(instanceIndex).assign(force);
  })()
    .compute(sCount)
    .setName('Cloth Spring Forces');

  // ── Compute shader 2 — accumulate vertex forces ──
  const computeVertices = Fn(() => {
    // Guard against out-of-bounds workgroup threads
    If(instanceIndex.greaterThanEqual(uint(vCount)), () => Return());

    const p = paramsBuf.element(instanceIndex).toVar();
    const isFixed = p.x;
    const sNum = p.y;
    const sPtr = p.z;

    If(isFixed, () => Return());

    const position = posBuf.element(instanceIndex).toVar('vertexPosition');
    const force = forceBuf.element(instanceIndex).toVar('vertexForce');

    force.mulAssign(dampeningU);

    const start = sPtr.toVar('ptrStart');
    const end = start.add(sNum).toVar('ptrEnd');

    Loop({ start, end, type: 'uint', condition: '<' }, ({ i }) => {
      const sid = springListBuf.element(i).toVar('sid');
      const sf = springForceBuf.element(sid);
      const svIds = springVtxIdBuf.element(sid);
      const factor = select(svIds.x.equal(instanceIndex), 1.0, -1.0);
      force.addAssign(sf.mul(factor));
    });

    // gravity
    force.y.subAssign(gravity);

    // wind
    const noise = triNoise3D(position, windFrequency, time)
      .sub(0.2)
      .mul(windAmplitude);
    const windForce = noise.mul(windU);
    force.addAssign(windDirU.mul(windForce));

    // collision with sphere (disabled for orphaned vertices in tatter holes)
    const activeVal = activeBuf.element(instanceIndex);
    const dSphere = position.add(force).sub(spherePosU);
    const sDist = dSphere.length();
    const sForce = sphereRadiusU
      .sub(sDist)
      .max(0)
      .mul(dSphere)
      .div(sDist)
      .mul(sphereU)
      .mul(activeVal);
    force.addAssign(sForce);

    // Clamp velocity to prevent simulation explosion
    const speed = force.length().toVar();
    If(speed.greaterThan(maxVelocityU), () => {
      force.mulAssign(maxVelocityU.div(speed));
    });

    forceBuf.element(instanceIndex).assign(force);
    posBuf.element(instanceIndex).addAssign(force);
  })()
    .compute(vCount)
    .setName('Cloth Vertex Forces');

  // ── Renderable cloth geometry ──
  const meshVCount = segmentsX * segmentsY;
  const geometry = new THREE.BufferGeometry();
  const vtxIdArr = new Uint32Array(meshVCount * 4);
  const uvArr = new Float32Array(meshVCount * 2);
  const getIdx = (gx, gy) => gy * segmentsX + gx;

  for (let x = 0; x < segmentsX; x += 1) {
    for (let y = 0; y < segmentsY; y += 1) {
      const idx = getIdx(x, y);
      vtxIdArr[idx * 4] = columns[x][y].id;
      vtxIdArr[idx * 4 + 1] = columns[x + 1][y].id;
      vtxIdArr[idx * 4 + 2] = columns[x][y + 1].id;
      vtxIdArr[idx * 4 + 3] = columns[x + 1][y + 1].id;

      // Average UV of the quad's four corner vertices
      const u = (x + 0.5) / segmentsX;
      const v = 1 - (y + 0.5) / segmentsY;
      uvArr[idx * 2] = u;
      uvArr[idx * 2 + 1] = v;
    }
  }

  // Pre-allocate index buffer at max capacity (all quads present)
  const maxFaces = (segmentsX - 1) * (segmentsY - 1);
  const indexArray = new Uint32Array(maxFaces * 6);
  const indexAttr = new THREE.BufferAttribute(indexArray, 1);

  // Rebuild visible faces based on tatter noise — called on param change.
  // Uses vertex-based noise (averaged per triangle) for organic tear shapes,
  // then marks orphaned vertices inactive so sphere collision passes through.
  const rebuildTatter = ({
    seed: tSeed = 42,
    scale: tScale = 3,
    edge: tEdge = 0,
    holes: tHoles = 0,
  } = {}) => {
    // Step 1 — compute noise per simulation vertex
    const vertexNoise = new Float32Array(vCount);
    for (let x = 0; x <= segmentsX; x += 1) {
      for (let y = 0; y <= segmentsY; y += 1) {
        const vid = columns[x][y].id;
        const nx = x / segmentsX;
        const ny = y / segmentsY;
        vertexNoise[vid] = fbm2D(nx * tScale, ny * tScale, tSeed);
      }
    }

    const edgeDepth = tEdge * 0.5;

    // Evaluate whether a single triangle should be removed.
    // Uses the average noise of its three simulation vertices for organic shapes.
    const shouldSkip = (v0id, v1id, v2id, cx, cy) => {
      if (tEdge === 0 && tHoles === 0) return false;

      const n = (vertexNoise[v0id] + vertexNoise[v1id] + vertexNoise[v2id]) / 3;

      // Edge tattering — faces near free (non-pinned) edges
      if (tEdge > 0 && edgeDepth > 0) {
        let minFreeDist;
        if (pinEdge === 'left') {
          minFreeDist = Math.min(1 - cx, cy, 1 - cy);
        } else {
          minFreeDist = Math.min(cx, 1 - cx, 1 - cy);
        }
        if (minFreeDist < edgeDepth) {
          const t = minFreeDist / edgeDepth;
          if (n < 0.7 - t * 0.65) return true;
        }
      }

      // Interior holes
      if (tHoles > 0 && n > 1 - tHoles * 0.4) return true;

      return false;
    };

    // Step 2 — build index buffer + track which vertices still have faces
    const faceCount = new Uint32Array(vCount);
    let count = 0;

    for (let x = 1; x < segmentsX; x += 1) {
      for (let y = 1; y < segmentsY; y += 1) {
        const id00 = columns[x][y].id;
        const id10 = columns[x - 1][y].id;
        const id11 = columns[x - 1][y - 1].id;
        const id01 = columns[x][y - 1].id;

        // Triangle A: (x,y) → (x-1,y) → (x-1,y-1)
        const ax = (x + (x - 1) + (x - 1)) / (3 * segmentsX);
        const ay = (y + y + (y - 1)) / (3 * segmentsY);
        if (!shouldSkip(id00, id10, id11, ax, ay)) {
          indexArray[count] = getIdx(x, y);
          indexArray[count + 1] = getIdx(x - 1, y);
          indexArray[count + 2] = getIdx(x - 1, y - 1);
          count += 3;
          faceCount[id00] += 1;
          faceCount[id10] += 1;
          faceCount[id11] += 1;
        }

        // Triangle B: (x,y) → (x-1,y-1) → (x,y-1)
        const bx = (x + (x - 1) + x) / (3 * segmentsX);
        const by = (y + (y - 1) + (y - 1)) / (3 * segmentsY);
        if (!shouldSkip(id00, id11, id01, bx, by)) {
          indexArray[count] = getIdx(x, y);
          indexArray[count + 1] = getIdx(x - 1, y - 1);
          indexArray[count + 2] = getIdx(x, y - 1);
          count += 3;
          faceCount[id00] += 1;
          faceCount[id11] += 1;
          faceCount[id01] += 1;
        }
      }
    }

    // Step 3 — update per-vertex active mask (orphaned = no surviving faces)
    for (let i = 0; i < vCount; i += 1) {
      activeArr[i] = faceCount[i] > 0 ? 1 : 0;
    }
    activeBuf.value.needsUpdate = true;

    geometry.setDrawRange(0, count);
    indexAttr.needsUpdate = true;
  };

  rebuildTatter(tatter);

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(meshVCount * 3), 3)
  );
  geometry.setAttribute(
    'vertexIds',
    new THREE.BufferAttribute(vtxIdArr, 4, false)
  );
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  geometry.setIndex(indexAttr);

  // ── Set positionNode + normalNode on caller-provided material ──
  // eslint-disable-next-line no-param-reassign
  material.positionNode = Fn(({ material: mat }) => {
    const ids = attribute('vertexIds');
    const v0 = posBuf.element(ids.x).toVar();
    const v1 = posBuf.element(ids.y).toVar();
    const v2 = posBuf.element(ids.z).toVar();
    const v3 = posBuf.element(ids.w).toVar();

    const top = v0.add(v1);
    const right = v1.add(v3);
    const bottom = v2.add(v3);
    const left = v0.add(v2);

    const tangent = right.sub(left).normalize();
    const bitangent = bottom.sub(top).normalize();
    const normal = cross(tangent, bitangent);

    // eslint-disable-next-line no-param-reassign
    mat.normalNode = transformNormalToView(normal).toVarying();

    return v0.add(v1).add(v2).add(v3).mul(0.25);
  })();

  // Reset simulation to initial rest positions and zero velocities.
  const reset = () => {
    posBuf.value.array.set(posArr);
    posBuf.value.needsUpdate = true;
    forceBuf.value.array.fill(0);
    forceBuf.value.needsUpdate = true;
  };

  return {
    computeSprings,
    computeVertices,
    rebuildTatter,
    reset,
    geometry,
    material,
    windU,
    windDirU,
    stiffnessU,
    dampeningU,
    maxVelocityU,
    spherePosU,
    sphereU,
    sphereRadiusU,
  };
}
