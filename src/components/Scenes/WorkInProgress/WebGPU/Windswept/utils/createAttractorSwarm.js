import {
  Fn,
  If,
  cross,
  hash,
  instanceIndex,
  instancedArray,
  normalGeometry,
  positionGeometry,
  select,
  transformNormalToView,
  uint,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Particles that wander far enough from the origin (a NaN escape, or just an
// attractor whose basin doesn't hold) are reseeded rather than left to drift
// off into the void forever.
const MAX_MAGNITUDE = 60;

function seededPosition(seedIndex, spread) {
  return vec3(
    hash(seedIndex.add(uint(11))),
    hash(seedIndex.add(uint(97))),
    hash(seedIndex.add(uint(211)))
  )
    .sub(0.5)
    .mul(spread);
}

// One particle swarm: a GPU compute pass advances each instance's
// position/velocity via `step` (a mode-specific physics callback — see
// utils/flowStep.js for strange-attractor flow-following and
// utils/physicalAttractors.js for gravity+spin), and an InstancedMesh
// renders `geometry`/`baseMaterial` at each resulting position — oriented
// so its local +Z axis points along the instance's current velocity, so
// tumbling leaves/petals face the way they're moving. Rendering and seeding
// are identical across modes; only the per-frame physics in `step` differs.
export default function createAttractorSwarm({
  count,
  step,
  geometry,
  baseMaterial,
  extraUniforms = {},
  seedOffset = 0,
  seedSpread = 3,
}) {
  const posBuf = instancedArray(count, 'vec3');
  const velBuf = instancedArray(count, 'vec3');

  const uniforms = {
    frameDelta: uniform(1 / 60),
    scale: uniform(1),
    speed: uniform(1),
    worldScale: uniform(1),
    ...extraUniforms,
  };

  const seedIndex = instanceIndex.add(uint(seedOffset));

  const initKernel = Fn(() => {
    posBuf.element(instanceIndex).assign(seededPosition(seedIndex, seedSpread));
    velBuf.element(instanceIndex).assign(vec3(0, 1, 0));
  })()
    .compute(count)
    .setName('Windswept Swarm Init');

  const updateKernel = Fn(() => {
    const position = posBuf.element(instanceIndex);
    const velocity = velBuf.element(instanceIndex);
    step({ position, uniforms, velocity });

    If(position.length().greaterThan(MAX_MAGNITUDE), () => {
      position.assign(seededPosition(seedIndex.add(instanceIndex), seedSpread));
      velocity.assign(vec3(0, 1, 0));
    });
  })()
    .compute(count)
    .setName('Windswept Swarm Update');

  const material = new THREE.MeshStandardNodeMaterial({
    color: baseMaterial.color ? baseMaterial.color.clone() : undefined,
    map: baseMaterial.map ?? null,
    metalness: baseMaterial.metalness ?? 0,
    roughness: baseMaterial.roughness ?? 0.8,
    side: THREE.DoubleSide,
  });

  // Orthonormal basis aligning local +Z to the instance's velocity — falls
  // back to an alternate reference axis when velocity is (near-)parallel to
  // world-up, where cross(worldUp, forward) would otherwise degenerate.
  const forward = velBuf.toAttribute().normalize().toVar();
  const worldUp = vec3(0, 1, 0);
  const altUp = vec3(1, 0, 0);
  const useAlt = forward.dot(worldUp).abs().greaterThan(0.999);
  const refUp = select(useAlt, altUp, worldUp);
  const right = cross(refUp, forward).normalize().toVar();
  const up = cross(forward, right).normalize().toVar();

  const orientedPosition = right
    .mul(positionGeometry.x)
    .add(up.mul(positionGeometry.y))
    .add(forward.mul(positionGeometry.z));
  material.positionNode = orientedPosition
    .mul(uniforms.scale)
    .add(posBuf.toAttribute().mul(uniforms.worldScale));

  const orientedNormal = right
    .mul(normalGeometry.x)
    .add(up.mul(normalGeometry.y))
    .add(forward.mul(normalGeometry.z));
  material.normalNode = transformNormalToView(orientedNormal.normalize());

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const dispose = () => {
    material.dispose();
  };

  return { dispose, initKernel, mesh, updateKernel, uniforms };
}
