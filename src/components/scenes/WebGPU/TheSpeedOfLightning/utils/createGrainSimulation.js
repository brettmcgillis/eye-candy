import {
  Fn,
  float,
  instanceIndex,
  instancedArray,
  uniform,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createBedLayout from './bedLayout';
import bedSurface from './bedSurface';
import createGrainCompute, { BED } from './grainCompute';
import createGrainMaterial from './grainMaterial';

function buildUniforms() {
  return {
    bedBaseY: uniform(0),
    bedDuneHeight: uniform(0.05),
    bedNoisePhase: uniform(0),
    bedNoiseScale: uniform(1),
    bedSettle: uniform(0.35),
    bounceFriction: uniform(0.55),
    bounceRestitution: uniform(0.32),
    bounceThreshold: uniform(0.25),
    boltDissolving: uniform(0),
    boltFallSpeed: uniform(0.35),
    boltLifeSpan: uniform(1.6),
    channelFlash: uniform(0),
    channelGlow: uniform(0.05),
    curlEvolve: uniform(0.25),
    curlFrequency: uniform(1.6),
    curlStrength: uniform(0.55),
    cycleReset: uniform(0),
    drag: uniform(0.9),
    dt: uniform(1 / 60),
    ejectFalloff: uniform(1.4),
    ejectLift: uniform(1.9),
    ejectSpeed: uniform(0.9),
    ejectSwirl: uniform(0.6),
    ejectaGlow: uniform(0.04),
    emergeArc: uniform(0.09),
    emissiveStrength: uniform(3.2),
    frontArc: uniform(-1),
    grainColor: uniform(new THREE.Color('#8fa6bd')),
    grainColorB: uniform(new THREE.Color('#6f8399')),
    grainColorC: uniform(new THREE.Color('#c7d4e2')),
    grainPaletteMix: uniform(0),
    grainPaletteSplitB: uniform(0.55),
    grainPaletteSplitC: uniform(0.85),
    grainSize: uniform(0.014),
    gravity: uniform(1.6),
    impactCenter: uniform(new THREE.Vector3()),
    leaderColor: uniform(new THREE.Color('#5f86b8')),
    returnArc: uniform(-10),
    returnBranchGlow: uniform(0),
    returnColor: uniform(new THREE.Color('#dfeeff')),
    returnStrength: uniform(0),
    returnWidth: uniform(0.5),
    shockInner: uniform(-1),
    shockOuter: uniform(-1),
    time: uniform(0),
    tipActive: uniform(1),
    tipFalloff: uniform(0.35),
  };
}

export default function createGrainSimulation({
  bedCount,
  bedRadius,
  bedThickness,
  boltCapacity,
  pileMemory,
  seed,
}) {
  // The reserve is `pileMemory` windows of bolt slots. Only one window carries
  // bolt targets at a time; the others are ordinary bed sand, which is what
  // lets a collapsed pile survive that many strikes before being drawn back up.
  const boltSlots = boltCapacity * pileMemory;
  const total = boltSlots + bedCount;
  const bedHome = new Float32Array(total * 4);
  const grainRot = new Float32Array(total * 4);
  const boltTarget = new Float32Array(total * 4);
  const boltParent = new Float32Array(total * 4);

  for (let index = 0; index < total; index += 1) {
    const slot = index * 4;
    grainRot[slot] = Math.random() * Math.PI * 2;
    grainRot[slot + 1] = Math.random() * Math.PI * 2;
    grainRot[slot + 2] = Math.random() * Math.PI * 2;
    grainRot[slot + 3] = Math.random();
    boltTarget[slot + 3] = -1;
  }

  createBedLayout({
    count: bedCount,
    home: bedHome,
    offset: boltSlots,
    radius: bedRadius,
    seed,
    thickness: bedThickness,
  });

  // The reserve starts buried and crowded toward the rim, so the first strikes
  // visibly draw their sand from the deep outer bed rather than from the middle
  // of frame. After that a grain simply lives wherever it last landed.
  createBedLayout({
    count: boltSlots,
    home: bedHome,
    minBury: bedThickness * 0.4,
    offset: 0,
    radialBias: 0.28,
    radius: bedRadius,
    seed: seed + 5171,
    surfaceFraction: 0,
    thickness: bedThickness * 0.55,
  });

  const buffers = {
    bedHome: instancedArray(bedHome, 'vec4'),
    boltParent: instancedArray(boltParent, 'vec4'),
    boltTarget: instancedArray(boltTarget, 'vec4'),
    grainRot: instancedArray(grainRot, 'vec4'),
    posRole: instancedArray(total, 'vec4'),
    velLife: instancedArray(total, 'vec4'),
  };

  const uniforms = buildUniforms();
  const computeKernel = createGrainCompute({ buffers, count: total, uniforms });

  const seedPool = Fn(() => {
    const home = buffers.bedHome.element(instanceIndex);
    const restY = uniforms.bedBaseY
      .add(
        bedSurface(
          home.x,
          home.z,
          uniforms.bedNoiseScale,
          uniforms.bedDuneHeight,
          uniforms.bedNoisePhase
        )
      )
      .sub(home.w);

    buffers.posRole
      .element(instanceIndex)
      .assign(vec4(home.x, restY, home.z, float(BED)));
    buffers.velLife.element(instanceIndex).assign(vec4(0, 0, 0, 0));
  })()
    .compute(total)
    .setName('The Speed Of Lightning Grain Seed');

  const geometry = new THREE.InstancedBufferGeometry().copy(
    new THREE.BoxGeometry(1, 1, 1)
  );
  geometry.instanceCount = total;

  const material = createGrainMaterial({ buffers, uniforms });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return {
    boltCapacity,
    boltParent,
    boltSlots,
    boltTarget,
    computeKernel,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    mesh,
    seedPool,
    total,
    uniforms,
    uploadBolt: () => {
      buffers.boltTarget.value.array.set(boltTarget);
      buffers.boltTarget.value.needsUpdate = true;
      buffers.boltParent.value.array.set(boltParent);
      buffers.boltParent.value.needsUpdate = true;
    },
  };
}
