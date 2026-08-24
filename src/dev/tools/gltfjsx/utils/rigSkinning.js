import * as THREE from 'three';

// In-browser auto-rigging helpers for the GLTF Workbench "Rig" tab.
//
// The workbench cannot run Blender-quality heat-diffusion skinning, so it takes
// the pragmatic route: generate a procedural armature (hand / chain / custom)
// the user nudges to fit, then compute topology-aware skin weights. Every bone
// carries a userData.group tag; a mesh is skinned only to its group's bones
// (group 'all' = the whole skeleton), which keeps e.g. interlaced praying-hands
// fingers from bleeding across hands.

// Canonical right-hand skeleton in a unit box: forearm base at the origin,
// fingers growing along +y, fingers fanned along x, palm thickness along z.
// Root is the forearm, then wrist, then each finger (metacarpal→…→tip), so the
// forearm and wrist angle are both posable. Each finger lists its joints
// (knuckle first, fingertip last); consecutive joints become bones.
const HAND_TEMPLATE = {
  forearm: [0, 0, 0],
  wrist: [0, 0.3, 0],
  fingers: [
    {
      name: 'Thumb',
      joints: [
        [0.15, 0.36],
        [0.22, 0.45],
        [0.28, 0.53],
        [0.33, 0.6],
      ],
    },
    {
      name: 'Index',
      joints: [
        [0.12, 0.55],
        [0.12, 0.69],
        [0.12, 0.8],
        [0.12, 0.9],
      ],
    },
    {
      name: 'Middle',
      joints: [
        [0.04, 0.56],
        [0.04, 0.72],
        [0.04, 0.85],
        [0.04, 0.96],
      ],
    },
    {
      name: 'Ring',
      joints: [
        [-0.04, 0.55],
        [-0.04, 0.7],
        [-0.04, 0.82],
        [-0.04, 0.92],
      ],
    },
    {
      name: 'Pinky',
      joints: [
        [-0.12, 0.52],
        [-0.12, 0.64],
        [-0.12, 0.73],
        [-0.12, 0.82],
      ],
    },
  ],
  // Canonical spans used to map the unit hand onto a real bounding box.
  fingerSpan: 0.96,
  spreadSpan: 0.5,
  thickSpan: 0.2,
};

export function collectSkinnableMeshes(scene) {
  const meshes = [];

  scene.traverse((node) => {
    if (node.isMesh && !node.isSkinnedMesh && node.geometry) {
      meshes.push(node);
    }
  });

  return meshes;
}

// Best-effort L/R detection from a mesh name (Hand_L, hand-right, etc.).
export function guessSide(name) {
  const value = String(name || '').toLowerCase();
  if (/(^|[^a-z])(l|left)([^a-z]|$)/.test(value) || /_l\b/.test(value)) {
    return 'L';
  }
  if (/(^|[^a-z])(r|right)([^a-z]|$)/.test(value) || /_r\b/.test(value)) {
    return 'R';
  }
  return 'R';
}

// Clone a mesh's geometry with its world transform baked in, so the rig can be
// authored in one flat world space (identity meshes, identity-framed bones).
export function bakeGeometryWorld(mesh) {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  return geometry;
}

// Pick world axes from a box: longest = finger direction, next = finger spread,
// shortest = palm thickness. Returns unit vectors plus the box extents.
function deriveBasis(box) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const axes = [
    { axis: new THREE.Vector3(1, 0, 0), len: size.x },
    { axis: new THREE.Vector3(0, 1, 0), len: size.y },
    { axis: new THREE.Vector3(0, 0, 1), len: size.z },
  ].sort((a, b) => b.len - a.len);

  return {
    center,
    fingerDir: axes[0].axis,
    fingerLen: axes[0].len,
    spreadDir: axes[1].axis,
    spreadLen: axes[1].len,
    thickDir: axes[2].axis,
    thickLen: axes[2].len,
  };
}

// Create a bone at a world position under an optional parent. Bones carry
// identity rotation, so a bone's local frame is world-aligned and its local
// position is simply (worldPos - parentWorldPos). Tags userData.group for
// per-mesh skinning masks. Pushes onto `flat` (skeleton order) when provided.
function addBone(name, worldPos, parent, group, flat) {
  const bone = new THREE.Bone();
  bone.name = name;
  bone.userData.group = group;
  const parentWorld = parent
    ? parent.getWorldPosition(new THREE.Vector3())
    : new THREE.Vector3();
  bone.position.copy(worldPos).sub(parentWorld);
  if (parent) parent.add(bone);
  bone.updateWorldMatrix(true, false);
  if (flat) flat.push(bone);
  return bone;
}

// Build a hand armature fitted to a baked mesh's bounding box. Root is the
// forearm → wrist → fingers, so wrist/forearm angle is posable. Bones are
// grouped by `side` so an L mesh only skins to L bones. Returns the root bone
// plus a flat, skeleton-ordered bone list.
export function buildHandArmature(side, box) {
  const basis = deriveBasis(box);
  const lenScale = basis.fingerLen / HAND_TEMPLATE.fingerSpan;
  const spreadScale = basis.spreadLen / HAND_TEMPLATE.spreadSpan;
  const thickScale = basis.thickLen / HAND_TEMPLATE.thickSpan;
  const mirror = side === 'L' ? -1 : 1;

  // Forearm base sits at the low end of the finger (longest) axis.
  const origin = basis.center
    .clone()
    .addScaledVector(basis.fingerDir, -basis.fingerLen / 2);

  const toWorld = ([cx, cy, cz = 0]) =>
    origin
      .clone()
      .addScaledVector(basis.spreadDir, cx * mirror * spreadScale)
      .addScaledVector(basis.fingerDir, cy * lenScale)
      .addScaledVector(basis.thickDir, cz * thickScale);

  const flat = [];
  const forearm = addBone(
    `${side}_Forearm`,
    toWorld(HAND_TEMPLATE.forearm),
    null,
    side,
    flat
  );
  const wrist = addBone(
    `${side}_Wrist`,
    toWorld(HAND_TEMPLATE.wrist),
    forearm,
    side,
    flat
  );

  HAND_TEMPLATE.fingers.forEach((finger) => {
    let parent = wrist;
    finger.joints.forEach((joint, index) => {
      parent = addBone(
        `${side}_${finger.name}_${index + 1}`,
        toWorld(joint),
        parent,
        side,
        flat
      );
    });
  });

  return { root: forearm, bones: flat };
}

// Build a straight N-bone chain fit along the box's longest axis (group 'all').
// Good for bills, ropes, tails, banners — anything that bends or waves.
export function buildChainArmature(box, count = 4) {
  const basis = deriveBasis(box);
  const start = basis.center
    .clone()
    .addScaledVector(basis.fingerDir, -basis.fingerLen / 2);
  const step = basis.fingerLen / count;

  const flat = [];
  let parent = null;
  let root = null;
  for (let i = 0; i <= count; i += 1) {
    const world = start.clone().addScaledVector(basis.fingerDir, step * i);
    const bone = addBone(`Chain_${i}`, world, parent, 'all', flat);
    if (!root) root = bone;
    parent = bone;
  }

  return { root, bones: flat };
}

// Create a single custom bone (group 'all') for manual authoring. A root bone
// (no parent) is parented to exportRoot so it lives in the rig graph.
export function createBone(name, worldPosition, parentBone, exportRoot) {
  const bone = addBone(name, worldPosition, parentBone || null, 'all', null);
  if (!parentBone && exportRoot) exportRoot.add(bone);
  return bone;
}

// Every bone in a subtree (the bone itself + descendant bones), e.g. for delete.
export function collectSubtree(bone) {
  const out = [];
  bone.traverse((node) => {
    if (node.isBone) out.push(node);
  });
  return out;
}

// Indices (into the full skeleton order) a mesh in `group` may be skinned to.
// Group 'all' (or falsy) returns every bone.
export function allowedIndicesForGroup(bones, group) {
  if (!group || group === 'all') return bones.map((_, index) => index);
  return bones
    .map((bone, index) => (bone.userData.group === group ? index : -1))
    .filter((index) => index >= 0);
}

// --- Topology-aware skinning -------------------------------------------------
//
// Adapted from Mesh2Motion (https://github.com/Mesh2Motion/mesh2motion-app,
// MIT © Scott Petrovic): rigid nearest-bone assignment followed by smoothing
// that blends weights ONLY across mesh edges. Unlike pure distance falloff,
// edge-based smoothing can't bleed between geometry islands that merely sit
// close together — exactly the interlaced praying-hands fingers case.

// Head/tail world segment for a bone (tail = first bone-child, or a short stub
// past a leaf), used as the geodesic seed line.
function boneSegment(bone) {
  const head = bone.getWorldPosition(new THREE.Vector3());
  const childBone = bone.children.find((child) => child.isBone);
  if (childBone) {
    return { head, tail: childBone.getWorldPosition(new THREE.Vector3()) };
  }
  const parentBone = bone.parent && bone.parent.isBone ? bone.parent : null;
  const dir = parentBone
    ? head.clone().sub(parentBone.getWorldPosition(new THREE.Vector3()))
    : new THREE.Vector3(0, 1, 0);
  if (dir.lengthSq() < 1e-12) dir.set(0, 1, 0);
  return { head, tail: head.clone().addScaledVector(dir, 0.5) };
}

function distanceToSegment(point, head, tail) {
  const ab = tail.clone().sub(head);
  const lengthSq = ab.lengthSq();
  if (lengthSq < 1e-12) return point.distanceTo(head);
  let t = point.clone().sub(head).dot(ab) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return point.distanceTo(head.clone().addScaledVector(ab, t));
}

// Binary min-heap of (distance, vertex) pairs for Dijkstra.
class MinHeap {
  constructor() {
    this.dist = [];
    this.vert = [];
  }

  get size() {
    return this.vert.length;
  }

  push(distance, vertex) {
    this.dist.push(distance);
    this.vert.push(vertex);
    let i = this.vert.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.dist[parent] <= this.dist[i]) break;
      this.swap(parent, i);
      i = parent;
    }
  }

  pop() {
    const distance = this.dist[0];
    const vertex = this.vert[0];
    const last = this.vert.length - 1;
    this.dist[0] = this.dist[last];
    this.vert[0] = this.vert[last];
    this.dist.pop();
    this.vert.pop();
    let i = 0;
    const n = this.vert.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.dist[left] < this.dist[smallest]) smallest = left;
      if (right < n && this.dist[right] < this.dist[smallest]) smallest = right;
      if (smallest === i) break;
      this.swap(smallest, i);
      i = smallest;
    }
    return [distance, vertex];
  }

  swap(a, b) {
    [this.dist[a], this.dist[b]] = [this.dist[b], this.dist[a]];
    [this.vert[a], this.vert[b]] = [this.vert[b], this.vert[a]];
  }
}

// Vertex adjacency from the face index (for boundary smoothing).
function buildVertexAdjacency(geometry, vertexCount) {
  const adjacency = Array.from({ length: vertexCount }, () => new Set());
  const { index } = geometry;
  if (!index) return adjacency;

  const { array } = index;
  for (let i = 0; i < array.length; i += 3) {
    const a = array[i];
    const b = array[i + 1];
    const c = array[i + 2];
    adjacency[a].add(b).add(c);
    adjacency[b].add(a).add(c);
    adjacency[c].add(a).add(b);
  }
  return adjacency;
}

// Weighted surface graph for geodesic distance: edge weight = vertex spacing.
// Co-located (seam-duplicated) vertices are joined by 0-weight edges so a path
// isn't blocked at a UV seam. Returns per-vertex arrays of { to, w }.
function buildGeodesicGraph(geometry, position, vertexCount, positionMap) {
  const neighbors = Array.from({ length: vertexCount }, () => new Map());
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  const addEdge = (i, j, weight) => {
    if (i === j) return;
    const existing = neighbors[i].get(j);
    if (existing === undefined || weight < existing) {
      neighbors[i].set(j, weight);
      neighbors[j].set(i, weight);
    }
  };

  const { index } = geometry;
  if (index) {
    const { array } = index;
    for (let f = 0; f < array.length; f += 3) {
      const x = array[f];
      const y = array[f + 1];
      const z = array[f + 2];
      a.fromBufferAttribute(position, x);
      b.fromBufferAttribute(position, y);
      const wxy = a.distanceTo(b);
      addEdge(x, y, wxy);
      b.fromBufferAttribute(position, z);
      addEdge(x, z, a.distanceTo(b));
      a.fromBufferAttribute(position, y);
      addEdge(y, z, a.distanceTo(b));
    }
  }

  positionMap.forEach((group) => {
    for (let k = 1; k < group.length; k += 1) {
      addEdge(group[0], group[k], 0);
    }
  });

  return neighbors.map((map) => Array.from(map, ([to, w]) => ({ to, w })));
}

// Multi-source Dijkstra: shortest surface distance from a set of seed vertices.
function geodesicField(graph, seeds, vertexCount) {
  const dist = new Float32Array(vertexCount).fill(Infinity);
  const heap = new MinHeap();
  seeds.forEach((seedDist, vertex) => {
    dist[vertex] = seedDist;
    heap.push(seedDist, vertex);
  });

  while (heap.size) {
    const [d, u] = heap.pop();
    if (d <= dist[u]) {
      const list = graph[u];
      for (let k = 0; k < list.length; k += 1) {
        const next = d + list[k].w;
        if (next < dist[list[k].to]) {
          dist[list[k].to] = next;
          heap.push(next, list[k].to);
        }
      }
    }
  }
  return dist;
}

// Group vertices that share a position (UV/normal seams duplicate them) so a
// blend applied to one is applied to all, keeping seams crack-free.
function buildPositionMap(position, vertexCount) {
  const map = new Map();
  for (let v = 0; v < vertexCount; v += 1) {
    const key = `${position.getX(v).toFixed(5)},${position.getY(v).toFixed(5)},${position.getZ(v).toFixed(5)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(v);
  }
  return map;
}

function positionKey(position, vertex) {
  return `${position.getX(vertex).toFixed(5)},${position.getY(vertex).toFixed(5)},${position.getZ(vertex).toFixed(5)}`;
}

function sharedVertices(vertex, position, positionMap) {
  return positionMap.get(positionKey(position, vertex)) || [vertex];
}

// Rigid nearest-bone assignment + edge-based boundary smoothing. Candidate bones
// are restricted to allowedIndices so an L mesh never picks up R bones; indices
// reference the full skeleton order. Same signature as before — only the
// internals changed (options.strength replaces the old falloff/maxInfluences).
export function computeSkinWeights(
  geometry,
  bones,
  allowedIndices,
  options = {}
) {
  const { strength = 0.5 } = options;
  const { position } = geometry.attributes;
  const vertexCount = position.count;

  const skinIndices = new Uint16Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);
  const vertex = new THREE.Vector3();

  // Blend a group of (position-shared) vertices to primary + secondary bone.
  const writeBlend = (group, primary, secondary, secondaryWeight) => {
    group.forEach((index) => {
      const offset = index * 4;
      skinIndices[offset] = primary;
      skinIndices[offset + 1] = secondary;
      skinIndices[offset + 2] = 0;
      skinIndices[offset + 3] = 0;
      skinWeights[offset] = 1 - secondaryWeight;
      skinWeights[offset + 1] = secondaryWeight;
      skinWeights[offset + 2] = 0;
      skinWeights[offset + 3] = 0;
    });
  };

  const adjacency = buildVertexAdjacency(geometry, vertexCount);
  const positionMap = buildPositionMap(position, vertexCount);
  const segments = bones.map((bone) => boneSegment(bone));

  geometry.computeBoundingBox();
  const seedRadius =
    geometry.boundingBox.getSize(new THREE.Vector3()).length() * 0.05;

  // Pass 1: assign each vertex to its closest allowed bone. With a face index we
  // measure GEODESIC (along-surface) distance — so a vertex on the side of one
  // finger isn't grabbed by a thumb bone that's merely near it in space. Without
  // an index we fall back to straight-line distance to the bone segment.
  if (geometry.index) {
    const graph = buildGeodesicGraph(
      geometry,
      position,
      vertexCount,
      positionMap
    );
    const best = new Float32Array(vertexCount).fill(Infinity);

    allowedIndices.forEach((boneIndex) => {
      const { head, tail } = segments[boneIndex];
      // Seed the bone from surface vertices near its segment (always at least
      // the single closest), then spread the distance across the surface.
      const seeds = new Map();
      let nearestVertex = -1;
      let nearestDistance = Infinity;
      for (let v = 0; v < vertexCount; v += 1) {
        vertex.fromBufferAttribute(position, v);
        const d = distanceToSegment(vertex, head, tail);
        if (d < nearestDistance) {
          nearestDistance = d;
          nearestVertex = v;
        }
        if (d <= seedRadius) seeds.set(v, d);
      }
      if (!seeds.size && nearestVertex >= 0) {
        seeds.set(nearestVertex, nearestDistance);
      }

      const field = geodesicField(graph, seeds, vertexCount);
      for (let v = 0; v < vertexCount; v += 1) {
        if (field[v] < best[v]) {
          best[v] = field[v];
          skinIndices[v * 4] = boneIndex;
          skinWeights[v * 4] = 1;
        }
      }
    });
  } else {
    for (let v = 0; v < vertexCount; v += 1) {
      vertex.fromBufferAttribute(position, v);
      let closest = allowedIndices[0] ?? 0;
      let closestDistance = Infinity;
      allowedIndices.forEach((boneIndex) => {
        const { head, tail } = segments[boneIndex];
        const d = distanceToSegment(vertex, head, tail);
        if (d < closestDistance) {
          closestDistance = d;
          closest = boneIndex;
        }
      });
      skinIndices[v * 4] = closest;
      skinWeights[v * 4] = 1;
    }
  }

  // Pass 2: blend across edges where adjacent vertices landed on different
  // bones. Parent↔child joints blend only the child side (so a bent knuckle
  // doesn't drag its parent); everything else gets a symmetric blend.
  const visited = new Set();

  for (let i = 0; i < vertexCount; i += 1) {
    const boneA = skinIndices[i * 4];

    if (skinWeights[i * 4] === 1) {
      adjacency[i].forEach((j) => {
        if (skinWeights[j * 4] !== 1) return;
        const boneB = skinIndices[j * 4];
        if (boneA === boneB) return;

        const key = i < j ? `${i},${j}` : `${j},${i}`;
        if (visited.has(key)) return;
        visited.add(key);

        const aIsParent = bones[boneB]?.parent === bones[boneA];
        const bIsParent = bones[boneA]?.parent === bones[boneB];

        if (aIsParent) {
          writeBlend(
            sharedVertices(j, position, positionMap),
            boneB,
            boneA,
            strength
          );
        } else if (bIsParent) {
          writeBlend(
            sharedVertices(i, position, positionMap),
            boneA,
            boneB,
            strength
          );
        } else {
          writeBlend(
            sharedVertices(i, position, positionMap),
            boneA,
            boneB,
            strength
          );
          writeBlend(
            sharedVertices(j, position, positionMap),
            boneB,
            boneA,
            strength
          );
        }
      });
    }
  }

  // Pass 3: guarantee every row sums to 1 (rigid rows already do).
  for (let v = 0; v < vertexCount; v += 1) {
    const offset = v * 4;
    const sum =
      skinWeights[offset] +
      skinWeights[offset + 1] +
      skinWeights[offset + 2] +
      skinWeights[offset + 3];
    if (sum > 0 && Math.abs(sum - 1) > 1e-4) {
      for (let k = 0; k < 4; k += 1) skinWeights[offset + k] /= sum;
    }
  }

  const skinned = geometry.clone();
  skinned.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute(skinIndices, 4)
  );
  skinned.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );
  return skinned;
}
