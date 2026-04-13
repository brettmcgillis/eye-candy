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

    // collision with sphere
    const dSphere = position.add(force).sub(spherePosU);
    const sDist = dSphere.length();
    const sForce = sphereRadiusU
      .sub(sDist)
      .max(0)
      .mul(dSphere)
      .div(sDist)
      .mul(sphereU);
    force.addAssign(sForce);

    forceBuf.element(instanceIndex).assign(force);
    posBuf.element(instanceIndex).addAssign(force);
  })()
    .compute(vCount)
    .setName('Cloth Vertex Forces');

  // ── Renderable cloth geometry ──
  const meshVCount = segmentsX * segmentsY;
  const geometry = new THREE.BufferGeometry();
  const vtxIdArr = new Uint32Array(meshVCount * 4);
  const indices = [];
  const getIdx = (gx, gy) => gy * segmentsX + gx;

  for (let x = 0; x < segmentsX; x += 1) {
    for (let y = 0; y < segmentsY; y += 1) {
      const idx = getIdx(x, y);
      vtxIdArr[idx * 4] = columns[x][y].id;
      vtxIdArr[idx * 4 + 1] = columns[x + 1][y].id;
      vtxIdArr[idx * 4 + 2] = columns[x][y + 1].id;
      vtxIdArr[idx * 4 + 3] = columns[x + 1][y + 1].id;

      if (x > 0 && y > 0) {
        indices.push(getIdx(x, y), getIdx(x - 1, y), getIdx(x - 1, y - 1));
        indices.push(getIdx(x, y), getIdx(x - 1, y - 1), getIdx(x, y - 1));
      }
    }
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(meshVCount * 3), 3)
  );
  geometry.setAttribute(
    'vertexIds',
    new THREE.BufferAttribute(vtxIdArr, 4, false)
  );
  geometry.setIndex(indices);

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

  return {
    computeSprings,
    computeVertices,
    geometry,
    material,
    windU,
    windDirU,
    stiffnessU,
    dampeningU,
    spherePosU,
    sphereU,
    sphereRadiusU,
  };
}
