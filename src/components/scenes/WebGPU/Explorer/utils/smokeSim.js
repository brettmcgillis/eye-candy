import {
  Fn,
  If,
  float,
  hash,
  instanceIndex,
  instancedArray,
  uint,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { softShadow } from '@modules/apollonian';
import { curlNoise } from '@modules/tsl';

const GOLDEN = 0x9e3779b9;
const SALT = 0x85ebca6b;

export function createSmokeUniforms() {
  return {
    buoyancy: uniform(0.4),
    cameraPos: uniform(new THREE.Vector3()),
    curlDrift: uniform(0.15),
    curlFrequency: uniform(0.35),
    curlStrength: uniform(2.4),
    drag: uniform(1.1),
    dt: uniform(1 / 60),
    ejectSpeed: uniform(1.2),
    emitterPos: uniform(new THREE.Vector3()),
    emitterRadius: uniform(0.6),
    emitterVelocity: uniform(new THREE.Vector3()),
    inherit: uniform(0.6),
    lifespan: uniform(4),
    reseed: uniform(0, 'uint'),
    shadowBias: uniform(0.16),
    shadowFrame: uniform(0, 'uint'),
    shadowHardness: uniform(6),
    shadowSteps: uniform(24, 'int'),
    shadowStride: uniform(6, 'uint'),
    sortJ: uniform(1, 'uint'),
    sortK: uniform(2, 'uint'),
    stepSafety: uniform(0.75),
    time: uniform(0),
  };
}

// The whole bitonic network as (k, j) pairs. Running all of it every frame is
// ~100 dispatches at 16k particles, so the scene walks the schedule a slice at
// a time: the order stays a few frames behind the particles, which for smoke
// this faint is not something you can see.
export function bitonicSchedule(count) {
  const passes = [];
  for (let k = 2; k <= count; k *= 2) {
    for (let j = k / 2; j >= 1; j /= 2) passes.push([k, j]);
  }
  return passes;
}

export default function createSmokeSimulation({ count, df, u }) {
  const posAge = instancedArray(count, 'vec4');
  const velLife = instancedArray(count, 'vec4');
  const shade = instancedArray(count, 'vec4');
  const order = instancedArray(count, 'vec2');

  const random = (offset) =>
    hash(instanceIndex.add(u.reseed).add(uint(offset)));

  // Uniform point on the unit sphere — the emitter surface the vision asks
  // particles to be sampled from.
  const surfacePoint = (a, b) => {
    const z = a.mul(2).sub(1);
    const radius = z.mul(z).oneMinus().max(0).sqrt();
    const phi = b.mul(2 * Math.PI);
    return vec3(radius.mul(phi.cos()), radius.mul(phi.sin()), z);
  };

  const seedKernel = Fn(() => {
    const dir = surfacePoint(
      hash(instanceIndex),
      hash(instanceIndex.add(uint(GOLDEN)))
    );
    const stagger = hash(instanceIndex.add(uint(SALT)));

    posAge
      .element(instanceIndex)
      .assign(
        vec4(
          u.emitterPos.add(dir.mul(u.emitterRadius)),
          stagger.mul(u.lifespan)
        )
      );
    velLife
      .element(instanceIndex)
      .assign(
        vec4(dir.mul(u.ejectSpeed), u.lifespan.mul(float(0.5).add(stagger)))
      );
    shade.element(instanceIndex).assign(vec4(stagger, 1, 0, 0));
    order.element(instanceIndex).assign(vec2(0, instanceIndex.toFloat()));
  })().compute(count);

  const simulateKernel = Fn(() => {
    const slot = posAge.element(instanceIndex);
    const motion = velLife.element(instanceIndex);
    const extra = shade.element(instanceIndex);

    const pos = slot.xyz.toVar();
    const age = slot.w.add(u.dt).toVar();
    const vel = motion.xyz.toVar();
    const life = motion.w.toVar();
    const seed = extra.x.toVar();
    const lit = extra.y.toVar();

    If(age.greaterThan(life), () => {
      const a = random(0);
      const b = random(GOLDEN);
      const c = random(SALT);
      const dir = surfacePoint(a, b);

      pos.assign(u.emitterPos.add(dir.mul(u.emitterRadius)));
      vel.assign(dir.mul(u.ejectSpeed).add(u.emitterVelocity.mul(u.inherit)));
      age.assign(0);
      life.assign(u.lifespan.mul(float(0.5).add(c)));
      seed.assign(c);
    }).Else(() => {
      const flow = curlNoise(
        pos.mul(u.curlFrequency).add(vec3(u.time.mul(u.curlDrift)))
      );
      vel.addAssign(flow.mul(u.curlStrength).mul(u.dt));
      vel.addAssign(vec3(0, u.buoyancy, 0).mul(u.dt));
      vel.mulAssign(u.drag.mul(u.dt).negate().exp());
      pos.addAssign(vel.mul(u.dt));
    });

    // Shadowing the plume against the fractal is what stops it reading as a
    // decal on top of the caverns, but it is a march per particle — so only
    // one particle in `shadowStride` re-marches each frame.
    If(
      instanceIndex
        .mod(u.shadowStride)
        .equal(u.shadowFrame.mod(u.shadowStride)),
      () => {
        const toLight = u.emitterPos.sub(pos).toVar();
        const distance = toLight.length().max(1e-4).toVar();
        lit.assign(
          softShadow(df, pos, toLight.div(distance), {
            hardness: u.shadowHardness,
            maxDist: distance,
            stepScale: u.stepSafety,
            steps: u.shadowSteps,
            tStart: u.shadowBias,
          })
        );
      }
    );

    slot.assign(vec4(pos, age));
    motion.assign(vec4(vel, life));
    extra.assign(vec4(seed, lit, 0, 0));
  })().compute(count);

  // Key is negated distance so a plain ascending sort puts the farthest
  // particle first, which is the order alpha blending needs.
  const keyKernel = Fn(() => {
    const pos = posAge.element(instanceIndex).xyz;
    order
      .element(instanceIndex)
      .assign(
        vec2(u.cameraPos.sub(pos).length().negate(), instanceIndex.toFloat())
      );
  })().compute(count);

  const sortKernel = Fn(() => {
    const partner = instanceIndex.bitXor(u.sortJ);

    If(partner.greaterThan(instanceIndex), () => {
      const mine = order.element(instanceIndex).toVar();
      const theirs = order.element(partner).toVar();

      const ascending = instanceIndex.bitAnd(u.sortK).equal(uint(0));
      const swap = float(0).toVar();
      If(ascending, () => {
        swap.assign(mine.x.greaterThan(theirs.x).select(float(1), float(0)));
      }).Else(() => {
        swap.assign(mine.x.lessThan(theirs.x).select(float(1), float(0)));
      });

      If(swap.greaterThan(0.5), () => {
        order.element(instanceIndex).assign(theirs);
        order.element(partner).assign(mine);
      });
    });
  })().compute(count);

  return {
    buffers: { order, posAge, shade, velLife },
    kernels: {
      key: keyKernel,
      seed: seedKernel,
      simulate: simulateKernel,
      sort: sortKernel,
    },
    schedule: bitonicSchedule(count),
  };
}
