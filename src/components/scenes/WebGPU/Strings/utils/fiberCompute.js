import {
  Fn,
  If,
  float,
  instanceIndex,
  instancedArray,
  length,
  max,
  mix,
  normalize,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

import { simplex3d } from './simplex3d';
import restThread from './threadField';
import waveField from './waveField';

function pointAddress(pointsPerStrand) {
  const perStrand = uint(pointsPerStrand);
  const strand = instanceIndex.div(perStrand);
  const t = instanceIndex.sub(strand.mul(perStrand));
  const along = t.toFloat().div(pointsPerStrand - 1);

  return { along, strand, t };
}

function createInitKernel(b, pointsPerStrand, u) {
  return Fn(() => {
    const { along, strand, t } = pointAddress(pointsPerStrand);
    const strandA = b.strandA.element(strand);
    const strandB = b.strandB.element(strand);
    const alongBefore = max(t.toFloat().sub(1), 0).div(pointsPerStrand - 1);

    const rest = restThread(strandA, strandB, along, u).toVar();
    const before = restThread(strandA, strandB, alongBefore, u);
    const pinned = t
      .equal(uint(0))
      .or(t.equal(uint(pointsPerStrand - 1)))
      .select(float(0), float(1));

    b.rest.element(instanceIndex).assign(vec4(rest, length(rest.sub(before))));
    b.pos.element(instanceIndex).assign(vec4(rest, pinned));
    b.prev.element(instanceIndex).assign(vec4(rest, 0));
  })().compute(b.pointCount);
}

// prev.w carries crest strength to the material: shading needs to know a point
// is riding a lock rather than lying flat, and in sim mode that is not
// something the material could work out analytically.
function createWaveKernel(b, mode, pointsPerStrand, u) {
  return Fn(() => {
    const { strand } = pointAddress(pointsPerStrand);
    const strandA = b.strandA.element(strand);
    const strandB = b.strandB.element(strand);
    const rest = b.rest.element(instanceIndex).xyz;
    const field = waveField(mode, rest, strandA, strandB, u);

    b.pos.element(instanceIndex).xyz.assign(rest.add(field.offset));
    b.prev.element(instanceIndex).w.assign(field.crest);
  })().compute(b.pointCount);
}

function createIntegrateKernel(b, mode, pointsPerStrand, u) {
  return Fn(() => {
    const p = b.pos.element(instanceIndex);
    const { strand } = pointAddress(pointsPerStrand);
    const rest = b.rest.element(instanceIndex).xyz;
    const field = waveField(
      mode,
      rest,
      b.strandA.element(strand),
      b.strandB.element(strand),
      u
    );

    // The wave is what drives the sim too — it is a target the threads are
    // pulled toward, so the solver adds drape, settling and lag to the same
    // motion the noise mode applies directly.
    If(p.w.greaterThan(0.5), () => {
      const prev = b.prev.element(instanceIndex);
      const drift = rest.mul(u.windScale);
      const wind = vec3(
        simplex3d(drift.add(vec3(u.phase.mul(0.3), 0, 0))),
        simplex3d(drift.add(vec3(0, u.phase.mul(0.3), 5))).mul(0.3),
        simplex3d(drift.add(vec3(0, 9, u.phase.mul(0.3))))
      ).mul(u.windStrength);
      const velocity = p.xyz.sub(prev.xyz).mul(u.damping);
      const target = rest.add(field.offset);
      const pull = target.sub(p.xyz).mul(u.wavePull);
      const accel = vec3(0, u.gravity.negate(), 0).add(wind);
      const next = p.xyz
        .add(velocity)
        .add(pull)
        .add(accel.mul(u.dt.mul(u.dt)))
        .toVar();

      prev.xyz.assign(p.xyz);
      p.xyz.assign(next);
    });

    b.prev.element(instanceIndex).w.assign(field.crest);
  })().compute(b.pointCount);
}

function createConstraintKernel(b, pointsPerStrand, u) {
  return Fn(() => {
    const { t } = pointAddress(pointsPerStrand);
    const p = b.pos.element(instanceIndex);
    const matchesParity = t.mod(uint(2)).toFloat().equal(u.parity);

    If(p.w.greaterThan(0.5).and(matchesParity), () => {
      const before = b.pos.element(instanceIndex.sub(1)).xyz;
      const after = b.pos.element(instanceIndex.add(1)).xyz;
      const restHere = b.rest.element(instanceIndex);
      const restBefore = b.rest.element(instanceIndex.sub(1)).xyz;
      const restAfter = b.rest.element(instanceIndex.add(1));

      const fromBefore = before.add(
        normalize(p.xyz.sub(before)).mul(restHere.w)
      );
      const fromAfter = after.add(normalize(p.xyz.sub(after)).mul(restAfter.w));
      const stretched = mix(
        p.xyz,
        fromBefore.add(fromAfter).mul(0.5),
        u.stiffness
      );

      const restOffset = restHere.xyz.sub(
        restBefore.add(restAfter.xyz).mul(0.5)
      );
      const shaped = mix(
        stretched,
        before.add(after).mul(0.5).add(restOffset),
        u.shapeRetention
      );

      p.xyz.assign(
        vec3(shaped.x, max(shaped.y, u.fieldDepth.mul(-0.4)), shaped.z)
      );
    });
  })().compute(b.pointCount);
}

export default function createFiberRuntime({ count, mode, segments, u }) {
  const pointsPerStrand = segments + 1;
  const strandCount = Math.max(count, 1);
  const pointCount = strandCount * pointsPerStrand;

  const buffers = {
    pointCount,
    pos: instancedArray(pointCount, 'vec4'),
    prev: instancedArray(pointCount, 'vec4'),
    rest: instancedArray(pointCount, 'vec4'),
    strandA: instancedArray(strandCount, 'vec4'),
    strandB: instancedArray(strandCount, 'vec4'),
  };

  return {
    buffers,
    mode,
    pointsPerStrand,
    strandCount,
    kernels: {
      constrain: createConstraintKernel(buffers, pointsPerStrand, u),
      init: createInitKernel(buffers, pointsPerStrand, u),
      integrate: createIntegrateKernel(buffers, mode, pointsPerStrand, u),
      wave: createWaveKernel(buffers, mode, pointsPerStrand, u),
    },
  };
}
