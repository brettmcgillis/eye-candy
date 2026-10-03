/* eslint-disable camelcase, no-param-reassign */
import {
  hash,
  instanceIndex,
  mx_noise_float,
  positionLocal,
  smoothstep,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// ez-tree supplies only geometry: its textures are swapped for node
// materials, so the CLI can run it headless and the trees take the mood's
// colours. Templates are unit height; an instance's scale is metres.
const KINDS = {
  ash: { preset: 'Ash Large', seed: 31 },
  aspen: { preset: 'Aspen Large', seed: 47 },
  bush: { preset: 'Bush 1', seed: 5 },
  dead: { leaves: false, preset: 'Ash Medium', seed: 71 },
  oak: { preset: 'Oak Large', seed: 13 },
  pine: { preset: 'Pine Large', seed: 23 },
  spruce: { preset: 'Pine Medium', seed: 59 },
};
const LODS = {
  far: { leafCount: 0.3, leafSize: 1.8, sections: 0.35, segments: 0.5 },
  near: { leafCount: 0.6, leafSize: 1.3, sections: 0.6, segments: 0.75 },
};
const NEAR_REACH = 140;

const templates = new Map();

function thin(record, factor, floor) {
  Object.keys(record).forEach((level) => {
    record[level] = Math.max(floor, Math.round(record[level] * factor));
  });
}

function buildTemplate(Tree, kind, lod) {
  const spec = KINDS[kind];
  const detail = LODS[lod];
  const tree = new Tree();
  tree.loadPreset(spec.preset);
  tree.options.seed = spec.seed;
  thin(tree.options.branch.sections, detail.sections, 2);
  thin(tree.options.branch.segments, detail.segments, 3);
  tree.options.leaves.count = Math.max(
    1,
    Math.round(tree.options.leaves.count * detail.leafCount)
  );
  tree.options.leaves.size *= detail.leafSize;
  tree.generate();

  const branches = tree.branchesMesh.geometry.clone();
  const leaves =
    spec.leaves === false ? null : tree.leavesMesh.geometry.clone();
  branches.computeBoundingBox();
  const unit = 1 / Math.max(branches.boundingBox.max.y, 1e-3);
  [branches, leaves].forEach((geometry) => geometry?.scale(unit, unit, unit));
  tree.branchesMesh.geometry.dispose();
  tree.leavesMesh.geometry.dispose();
  [tree.branchesMesh.material, tree.leavesMesh.material].forEach((m) =>
    m?.dispose?.()
  );
  return { branches, leaves };
}

function templateFor(Tree, kind, lod) {
  const key = `${kind}:${lod}`;
  if (!templates.has(key)) templates.set(key, buildTemplate(Tree, kind, lod));
  return templates.get(key);
}

export function createTreeUniforms() {
  return {
    bark: uniform(new THREE.Color('#2c2620')),
    foliage: uniform(new THREE.Color('#26301e')),
  };
}

export function applyTrees(uniforms, config) {
  uniforms.bark.value.set(config.barkColor);
  uniforms.foliage.value.set(config.foliageColor);
}

function createBarkMaterial(uniforms) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 1,
  });
  const ridges = mx_noise_float(positionLocal.mul(vec2(140, 18).xyx));
  material.colorNode = uniforms.bark.mul(ridges.mul(0.25).add(0.9));
  return material;
}

// Leaf cards cut out procedurally: a ragged clump per card, each tree a
// slightly different green.
function createLeafMaterial(uniforms) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const centred = uv().sub(0.5).length().mul(2).oneMinus();
  const ragged = mx_noise_float(uv().mul(7)).mul(0.55);
  material.opacityNode = smoothstep(0.2, 0.35, centred.add(ragged));
  material.alphaTest = 0.5;
  const tint = hash(instanceIndex).mul(0.35).add(0.8);
  const fleck = mx_noise_float(uv().mul(13)).mul(0.2).add(0.95);
  material.colorNode = uniforms.foliage.mul(tint).mul(fleck);
  return material;
}

const matrix = new THREE.Matrix4();
const rotation = new THREE.Matrix4();
const lean = new THREE.Matrix4();
const axis = new THREE.Vector3();

function poseMatrix(tree) {
  axis.set(Math.cos(tree.leanYaw), 0, Math.sin(tree.leanYaw));
  lean.makeRotationAxis(axis, tree.lean);
  rotation.makeRotationY(tree.yaw);
  matrix.makeScale(tree.scale, tree.scale, tree.scale);
  matrix.premultiply(rotation).premultiply(lean);
  matrix.setPosition(tree.x, tree.y, tree.z);
  return matrix;
}

function instanced(geometry, material, poses) {
  const mesh = new THREE.InstancedMesh(geometry, material, poses.length);
  // A uniform-buffer instanceMatrix past 1024 instances overflows the 64KB
  // binding; the storage path is chosen regardless of count.
  mesh.instanceMatrix = new THREE.StorageInstancedBufferAttribute(
    new Float32Array(poses.length * 16),
    16
  );
  poses.forEach((pose, i) => mesh.setMatrixAt(i, poseMatrix(pose)));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

// The forest as one instanced pair (bark, leaves) per kind and detail
// level. Rebuilt whole when the site changes; templates are cached.
export function createForest(Tree, uniforms) {
  const group = new THREE.Group();
  const bark = createBarkMaterial(uniforms);
  const leaf = createLeafMaterial(uniforms);

  function clear() {
    [...group.children].forEach((mesh) => {
      group.remove(mesh);
      mesh.dispose?.();
    });
  }

  return {
    group,

    set({ foot, saplings, trees }, config) {
      clear();
      if (!Tree) return;
      const near = foot + config.clearing + NEAR_REACH;
      const buckets = new Map();
      [...trees, ...saplings].forEach((tree) => {
        const lod = Math.hypot(tree.x, tree.z) < near ? 'near' : 'far';
        const key = `${tree.kind}:${lod}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(tree);
      });
      buckets.forEach((poses, key) => {
        const [kind, lod] = key.split(':');
        const template = templateFor(Tree, kind, lod);
        group.add(instanced(template.branches, bark, poses));
        if (template.leaves) group.add(instanced(template.leaves, leaf, poses));
      });
    },

    dispose() {
      clear();
      bark.dispose();
      leaf.dispose();
    },
  };
}
