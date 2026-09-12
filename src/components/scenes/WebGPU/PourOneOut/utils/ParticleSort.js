import {
  Fn,
  If,
  float,
  instanceIndex,
  instancedArray,
  uint,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Bitonic network as (k, j) pairs. The full network is ~150 dispatches at this
// budget, so the frame loop walks a slice of it and the draw order trails the
// particles by a few frames rather than stalling on a full sort.
export function sortSchedule(count) {
  const passes = [];
  for (let k = 2; k <= count; k *= 2) {
    for (let j = k / 2; j >= 1; j /= 2) passes.push([k, j]);
  }
  return passes;
}

const FAR_BEHIND = 1e9;

export default class ParticleSort {
  constructor(simulator) {
    this.count = simulator.maxParticles;
    this.cursor = 0;
    this.schedule = sortSchedule(this.count);

    this.uniforms = {
      eye: uniform(new THREE.Vector3()),
      sortJ: uniform(1, 'uint'),
      sortK: uniform(2, 'uint'),
    };

    this.order = instancedArray(this.count, 'vec2').setName('fluidOrder');

    const { positions } = simulator.buffers;
    const live = simulator.uniforms.particleCount;

    // Negated distance, so a plain ascending sort leaves the farthest particle
    // in slot zero. Particles past the live count get a key nothing beats, which
    // parks them past the end of the range the mesh actually draws.
    this.key = Fn(() => {
      const position = positions.element(instanceIndex).xyz;
      const distance = this.uniforms.eye
        .sub(position)
        .length()
        .negate()
        .toVar('key');
      If(instanceIndex.greaterThanEqual(live), () => {
        distance.assign(float(FAR_BEHIND));
      });
      this.order
        .element(instanceIndex)
        .assign(vec2(distance, float(instanceIndex)));
    })().compute(this.count);

    this.sort = Fn(() => {
      const partner = instanceIndex.bitXor(this.uniforms.sortJ);

      If(partner.greaterThan(instanceIndex), () => {
        const mine = this.order.element(instanceIndex).toVar('mine');
        const theirs = this.order.element(partner).toVar('theirs');

        const ascending = instanceIndex
          .bitAnd(this.uniforms.sortK)
          .equal(uint(0));
        const swap = float(0).toVar('swap');
        If(ascending, () => {
          swap.assign(mine.x.greaterThan(theirs.x).select(float(1), float(0)));
        }).Else(() => {
          swap.assign(mine.x.lessThan(theirs.x).select(float(1), float(0)));
        });

        If(swap.greaterThan(0.5), () => {
          this.order.element(instanceIndex).assign(theirs);
          this.order.element(partner).assign(mine);
        });
      });
    })().compute(this.count);
  }

  rewind() {
    this.cursor = 0;
  }

  // Re-keying mid-network would break the ordering the remaining passes assume,
  // so the keys are only rewritten at the top of the schedule.
  step(renderer, eye, passes) {
    this.uniforms.eye.value.copy(eye);

    if (this.cursor === 0) renderer.compute(this.key);
    if (passes <= 0) return;

    for (let n = 0; n < passes; n += 1) {
      const [k, j] = this.schedule[this.cursor];
      this.uniforms.sortK.value = k;
      this.uniforms.sortJ.value = j;
      renderer.compute(this.sort);

      this.cursor = (this.cursor + 1) % this.schedule.length;
      if (this.cursor === 0) break;
    }
  }
}
