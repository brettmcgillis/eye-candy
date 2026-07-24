/* eslint-disable no-param-reassign */
import * as THREE from 'three';

// The two baked window meshes and the exact transforms Factory.jsx renders them
// with — so extracted rects land in the factory group's local space.
const WINDOW_NODES = [
  {
    key: 'FACTORY_FrontLeft_Windows',
    matrix: new THREE.Matrix4().makeScale(0.01, 0.01, 0.01),
  },
  {
    key: 'FACTORY_BackRight_Windows',
    matrix: new THREE.Matrix4().compose(
      new THREE.Vector3(-1.105, 0, -0.011),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-Math.PI, 0, -Math.PI)
      ),
      new THREE.Vector3(0.01, 0.01, 0.01)
    ),
  },
];

const QUANT = 1e3;

function quantKey(x, y, z) {
  return `${Math.round(x * QUANT)},${Math.round(y * QUANT)},${Math.round(z * QUANT)}`;
}

function find(parent, i) {
  let root = i;
  while (parent[root] !== root) {
    root = parent[root];
  }
  let node = i;
  while (parent[node] !== root) {
    const next = parent[node];
    parent[node] = root;
    node = next;
  }
  return root;
}

function union(parent, a, b) {
  const ra = find(parent, a);
  const rb = find(parent, b);
  if (ra !== rb) {
    parent[ra] = rb;
  }
}

// Splits a merged window mesh into connected-component islands (one per window
// opening), then reduces each island to an oriented rect in factory-local
// space: center, in-plane axes, outward normal, width, height.
function extractMeshIslands(geometry, nodeMatrix) {
  const { position } = geometry.attributes;
  const { index } = geometry;
  const triCount = index ? index.count / 3 : position.count / 3;

  // Map coincident vertices to a shared representative id.
  const repByKey = new Map();
  const repOf = new Int32Array(position.count);
  for (let v = 0; v < position.count; v += 1) {
    const key = quantKey(position.getX(v), position.getY(v), position.getZ(v));
    if (!repByKey.has(key)) {
      repByKey.set(key, v);
    }
    repOf[v] = repByKey.get(key);
  }

  const parent = new Int32Array(position.count);
  for (let v = 0; v < position.count; v += 1) {
    parent[v] = repOf[v];
  }

  const triVerts = new Int32Array(triCount * 3);
  for (let t = 0; t < triCount; t += 1) {
    const a = index ? index.getX(t * 3) : t * 3;
    const b = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    triVerts[t * 3] = repOf[a];
    triVerts[t * 3 + 1] = repOf[b];
    triVerts[t * 3 + 2] = repOf[c];
    union(parent, repOf[a], repOf[b]);
    union(parent, repOf[b], repOf[c]);
  }

  const islands = new Map();
  for (let t = 0; t < triCount; t += 1) {
    const root = find(parent, triVerts[t * 3]);
    if (!islands.has(root)) {
      islands.set(root, { verts: new Set(), normal: new THREE.Vector3() });
    }
    const island = islands.get(root);
    island.verts.add(triVerts[t * 3]);
    island.verts.add(triVerts[t * 3 + 1]);
    island.verts.add(triVerts[t * 3 + 2]);
  }

  const rects = [];
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const triNormal = new THREE.Vector3();

  // Accumulate per-island face normals.
  for (let t = 0; t < triCount; t += 1) {
    const a = index ? index.getX(t * 3) : t * 3;
    const b = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    pA.fromBufferAttribute(position, a);
    pB.fromBufferAttribute(position, b);
    pC.fromBufferAttribute(position, c);
    edge1.subVectors(pB, pA);
    edge2.subVectors(pC, pA);
    triNormal.crossVectors(edge1, edge2);
    const island = islands.get(find(parent, triVerts[t * 3]));
    island.normal.add(triNormal);
  }

  islands.forEach((island) => {
    if (island.verts.size < 4) {
      return;
    }
    const normal = island.normal.clone().normalize();
    if (normal.lengthSq() < 0.5) {
      return;
    }

    // In-plane basis.
    const up =
      Math.abs(normal.y) > 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
    const tAxis = new THREE.Vector3().crossVectors(up, normal).normalize();
    const bAxis = new THREE.Vector3().crossVectors(normal, tAxis).normalize();

    const center = new THREE.Vector3();
    const point = new THREE.Vector3();
    island.verts.forEach((v) => {
      center.add(point.fromBufferAttribute(position, v));
    });
    center.divideScalar(island.verts.size);

    let minT = Infinity;
    let maxT = -Infinity;
    let minB = Infinity;
    let maxB = -Infinity;
    island.verts.forEach((v) => {
      point.fromBufferAttribute(position, v).sub(center);
      const dt = point.dot(tAxis);
      const db = point.dot(bAxis);
      minT = Math.min(minT, dt);
      maxT = Math.max(maxT, dt);
      minB = Math.min(minB, db);
      maxB = Math.max(maxB, db);
    });

    center.add(tAxis.clone().multiplyScalar((minT + maxT) / 2));
    center.add(bAxis.clone().multiplyScalar((minB + maxB) / 2));

    // Transform center (point) and axes (directions) into factory-local space.
    const worldCenter = center.clone().applyMatrix4(nodeMatrix);
    const worldT = tAxis
      .clone()
      .add(center)
      .applyMatrix4(nodeMatrix)
      .sub(worldCenter)
      .normalize();
    const worldB = bAxis
      .clone()
      .add(center)
      .applyMatrix4(nodeMatrix)
      .sub(worldCenter)
      .normalize();
    const worldN = new THREE.Vector3().crossVectors(worldT, worldB).normalize();

    const scale = nodeMatrix.getMaxScaleOnAxis();
    rects.push({
      center: worldCenter,
      tAxis: worldT,
      bAxis: worldB,
      normal: worldN,
      width: (maxT - minT) * scale,
      height: (maxB - minB) * scale,
    });
  });

  return rects;
}

export default function extractWindowRects(nodes) {
  const rects = [];
  WINDOW_NODES.forEach(({ key, matrix }) => {
    const geometry = nodes[key]?.geometry;
    if (geometry) {
      rects.push(...extractMeshIslands(geometry, matrix));
    }
  });
  return rects;
}
