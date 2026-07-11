import {
  Fn,
  If,
  float,
  hash,
  instanceIndex,
  instancedArray,
  instancedBufferAttribute,
  mat4,
  mix,
  select,
  smoothstep,
  uint,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import curlNoise from './curlNoise';

// GPU particle simulation for the bird. One compute pass per frame:
//   1. Re-skin each particle's "home" point from the live bone matrices
//      (uploaded as a storage buffer — the rig has ~714 joints).
//   2. Bound particles swirl around their home via curl noise, riding the
//      animated surface; wing motion is inherited exactly because home
//      tracks the skinned point.
//   3. Fast-moving home points (wing tips) probabilistically emit their
//      particle: it inherits the wing velocity, flies free under curl
//      noise + pointer attractor + drag, fades out, then rebinds.
//
// WebGPU allows only 8 storage buffers per shader stage, so per-particle
// data is packed into exactly 8 vec4/vec3 buffers:
//   staticA  = basePos.xyz  + emitterMask   (read-only)
//   staticB  = baseNormal.xyz + seed        (read-only)
//   skinIndex, skinWeight                   (read-only)
//   bones    = 4 vec4 columns per bone      (uploaded per frame)
//   posLife  = pos.xyz + life               (read/write)
//   velSpeed = vel.xyz + speed              (read/write)
//   prevHome = last frame's skinned home    (read/write)
// Render-only statics (gradient param, seed) ride as instanced attributes.

function packVec4(xyz, w, count) {
  const packed = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    packed[i * 4] = xyz[i * 3];
    packed[i * 4 + 1] = xyz[i * 3 + 1];
    packed[i * 4 + 2] = xyz[i * 3 + 2];
    packed[i * 4 + 3] = w[i];
  }
  return packed;
}

export default function createParticleSimulation(samples, skeleton) {
  const { count } = samples;
  const boneCount = skeleton.bones.length;

  // ── Storage buffers (8 = the per-stage WebGPU limit) ──
  const staticABuf = instancedArray(
    packVec4(samples.basePos, samples.emitterMask, count),
    'vec4'
  );
  const staticBBuf = instancedArray(
    packVec4(samples.baseNormal, samples.seedRand, count),
    'vec4'
  );
  const skinIndexBuf = instancedArray(samples.skinIndex, 'vec4');
  const skinWeightBuf = instancedArray(samples.skinWeight, 'vec4');
  const boneBuf = instancedArray(boneCount * 4, 'vec4');
  const posLifeBuf = instancedArray(
    packVec4(samples.basePos, new Float32Array(count), count),
    'vec4'
  );
  const velSpeedBuf = instancedArray(count, 'vec4');
  const prevHomeBuf = instancedArray(samples.basePos.slice(), 'vec3');

  // ── Uniforms ──
  const uniforms = {
    dt: uniform(1 / 60),
    time: uniform(0),
    emitGate: uniform(0),

    boundFlow: uniform(0.6),
    boundFreq: uniform(2.0),
    boundSpring: uniform(6.0),
    shell: uniform(0.05),
    evolve: uniform(0.4),
    touchBoost: uniform(1),

    emitRate: uniform(3),
    emitMinSpeed: uniform(1.5),
    emitMaxSpeed: uniform(6),
    feathersOnly: uniform(1),
    inherit: uniform(0.35),
    kick: uniform(0.4),
    lifeSpan: uniform(1.6),
    freeCurl: uniform(2.5),
    freeFreq: uniform(1.2),
    freeDrag: uniform(1.2),
    gravity: uniform(0),

    attractorOn: uniform(0),
    attractorPos: uniform(new THREE.Vector3(0, -100, 0)),
    attractorStrength: uniform(6),
    attractorRadius: uniform(1.5),

    size: uniform(0.008),
    emittedSize: uniform(0.008),
    intensity: uniform(1.2),
    boundAlpha: uniform(0.35),
    freeAlpha: uniform(0.8),
    colorMode: uniform(0), // 0 solid | 1 gradient | 2 velocity
    colorA: uniform(new THREE.Color('#7fe7ff')),
    colorB: uniform(new THREE.Color('#ff4fd8')),
    speedMin: uniform(0.2),
    speedMax: uniform(5),
  };

  const boneMatrix = (index) => {
    const base = uint(index).mul(4);
    return mat4(
      boneBuf.element(base),
      boneBuf.element(base.add(1)),
      boneBuf.element(base.add(2)),
      boneBuf.element(base.add(3))
    );
  };

  // ── Compute kernel ──
  const computeKernel = Fn(() => {
    If(instanceIndex.lessThan(uint(count)), () => {
      const { dt } = uniforms;
      const staticA = staticABuf.element(instanceIndex).toVar();
      const staticB = staticBBuf.element(instanceIndex).toVar();
      const seedR = staticB.w;
      const mask = staticA.w;

      // Re-skin home position + normal from live bones.
      const skinIdx = skinIndexBuf.element(instanceIndex).toVar();
      const skinW = skinWeightBuf.element(instanceIndex).toVar();
      const p4 = vec4(staticA.xyz, 1).toVar();
      const n4 = vec4(staticB.xyz, 0).toVar();

      const m0 = boneMatrix(skinIdx.x);
      const m1 = boneMatrix(skinIdx.y);
      const m2 = boneMatrix(skinIdx.z);
      const m3 = boneMatrix(skinIdx.w);

      const skinnedPos = m0
        .mul(p4)
        .mul(skinW.x)
        .add(m1.mul(p4).mul(skinW.y))
        .add(m2.mul(p4).mul(skinW.z))
        .add(m3.mul(p4).mul(skinW.w));
      const skinnedNor = m0
        .mul(n4)
        .mul(skinW.x)
        .add(m1.mul(n4).mul(skinW.y))
        .add(m2.mul(n4).mul(skinW.z))
        .add(m3.mul(n4).mul(skinW.w));

      // In three's default 'attached' bind mode the bone matrices already
      // yield world-space positions (basePos has bindMatrix baked in) —
      // group transforms above the bird flow in through the bones.
      const home = skinnedPos.xyz.toVar();
      const normalW = skinnedNor.xyz.normalize().toVar();

      const homeOld = prevHomeBuf.element(instanceIndex).toVar();
      prevHomeBuf.element(instanceIndex).assign(home);
      const homeVel = home.sub(homeOld).div(dt).toVar();
      const homeSpeed = homeVel.length().toVar();

      const posLife = posLifeBuf.element(instanceIndex).toVar();
      const velSpeed = velSpeedBuf.element(instanceIndex).toVar();
      const pos = posLife.xyz.toVar();
      const vel = velSpeed.xyz.toVar();
      const life = posLife.w.toVar();
      const posBefore = vec3(pos).toVar();

      If(life.greaterThan(0), () => {
        // ── Free flight ──
        const curlF = curlNoise(
          pos.mul(uniforms.freeFreq).add(uniforms.time.mul(uniforms.evolve))
        );
        vel.addAssign(curlF.mul(uniforms.freeCurl).mul(dt));
        vel.addAssign(vec3(0, uniforms.gravity, 0).mul(dt));

        If(uniforms.attractorOn.greaterThan(0.5), () => {
          const toA = uniforms.attractorPos.sub(pos).toVar();
          const d = toA.length().max(1e-4);
          const falloff = float(1)
            .sub(d.div(uniforms.attractorRadius))
            .clamp(0, 1);
          vel.addAssign(
            toA.div(d).mul(uniforms.attractorStrength).mul(falloff).mul(dt)
          );
        });

        vel.mulAssign(float(1).sub(uniforms.freeDrag.mul(dt)).clamp(0, 1));
        pos.addAssign(vel.mul(dt));

        const lifeJitter = seedR.mul(0.6).add(0.7);
        life.subAssign(dt.div(uniforms.lifeSpan.mul(lifeJitter)));
        If(life.lessThanEqual(0), () => {
          life.assign(0);
          pos.assign(home);
          vel.assign(vec3(0));
        });
      }).Else(() => {
        // ── Bound: swirl around the moving skinned home ──
        const offset = pos.sub(homeOld).toVar();
        const flow = curlNoise(
          home
            .add(offset)
            .mul(uniforms.boundFreq)
            .add(uniforms.time.mul(uniforms.evolve))
        );
        offset.addAssign(
          flow.mul(uniforms.boundFlow).mul(uniforms.touchBoost).mul(dt)
        );
        offset.mulAssign(
          float(1).sub(uniforms.boundSpring.mul(dt)).clamp(0, 1)
        );

        const len = offset.length().max(1e-5);
        offset.assign(offset.div(len).mul(len.min(uniforms.shell)));
        pos.assign(home.add(offset));
        vel.assign(homeVel);

        // ── Emission — probability scales with home-point speed, so the
        // fastest surface (wing tips) sheds the most particles. Mask
        // encoding: 0 interior, 1 surface, 2 feather. ──
        const isFeather = mask.greaterThan(1.5);
        const isSurface = mask.greaterThan(0.5);
        const allowed = select(
          uniforms.feathersOnly.greaterThan(0.5),
          select(isFeather, float(1), float(0)),
          select(isSurface, float(1), float(0))
        );
        const gate = smoothstep(
          uniforms.emitMinSpeed,
          uniforms.emitMaxSpeed,
          homeSpeed
        );
        const probability = uniforms.emitRate.mul(dt).mul(gate).mul(allowed);
        const rnd = hash(
          instanceIndex.toFloat().add(uniforms.time.mul(119.317))
        );
        If(
          rnd.lessThan(probability).and(uniforms.emitGate.greaterThan(0.5)),
          () => {
            life.assign(1);
            vel.assign(
              homeVel.mul(uniforms.inherit).add(normalW.mul(uniforms.kick))
            );
          }
        );
      });

      const speed = pos.sub(posBefore).length().div(dt);
      posLifeBuf.element(instanceIndex).assign(vec4(pos, life));
      velSpeedBuf.element(instanceIndex).assign(vec4(vel, speed));
    });
  })()
    .compute(count)
    .setName('Weightless Bird Particles');

  // ── Instanced sprite rendering ──
  const geometry = new THREE.InstancedBufferGeometry().copy(
    new THREE.PlaneGeometry(1, 1)
  );
  geometry.instanceCount = count;

  // Render-only statics as instanced attributes — keeps the vertex stage
  // storage-buffer count low.
  const gradAttr = new THREE.InstancedBufferAttribute(samples.gradParam, 1);
  const seedAttr = new THREE.InstancedBufferAttribute(samples.seedRand, 1);

  const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const posLifeAttr = posLifeBuf.toAttribute();
  const velSpeedAttr = velSpeedBuf.toAttribute();
  const lifeNode = posLifeAttr.w;
  const speedNode = velSpeedAttr.w;
  const seedNode = instancedBufferAttribute(seedAttr);
  const isFree = lifeNode.greaterThan(0);

  material.positionNode = posLifeAttr.xyz;

  // Bound particles hold steady at `size`. Emitted particles use their own
  // `emittedSize` and ease in over the first ~12% of life before shrinking
  // out (matches the Embers.jsx growth-then-shrink convention) rather than
  // starting at full size and only ever shrinking.
  const ageNorm = float(1).sub(lifeNode).clamp(0, 1);
  const emittedScaleCurve = smoothstep(0, 0.12, ageNorm).mul(
    float(1).sub(ageNorm).pow(0.7)
  );
  const sizeJitter = mix(float(0.6), float(1.4), seedNode);
  material.scaleNode = sizeJitter.mul(
    select(isFree, uniforms.emittedSize.mul(emittedScaleCurve), uniforms.size)
  );

  material.colorNode = Fn(() => {
    const d = uv().sub(0.5).length();
    const diskMask = smoothstep(0.5, 0.08, d);

    const tVel = smoothstep(uniforms.speedMin, uniforms.speedMax, speedNode);
    const grad = instancedBufferAttribute(gradAttr);
    const col = select(
      uniforms.colorMode.lessThan(0.5),
      uniforms.colorA,
      select(
        uniforms.colorMode.lessThan(1.5),
        mix(uniforms.colorA, uniforms.colorB, grad),
        mix(uniforms.colorA, uniforms.colorB, tVel)
      )
    );

    const alpha = select(
      isFree,
      smoothstep(0, 0.25, lifeNode).mul(uniforms.freeAlpha),
      uniforms.boundAlpha
    );
    return vec4(col.mul(uniforms.intensity), diskMask.mul(alpha));
  })();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  const setBoneMatrices = () => {
    boneBuf.value.array.set(skeleton.boneMatrices);
    boneBuf.value.needsUpdate = true;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return { computeKernel, mesh, uniforms, setBoneMatrices, dispose };
}
