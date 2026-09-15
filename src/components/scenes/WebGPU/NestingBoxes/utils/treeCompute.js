import {
  Fn,
  If,
  Loop,
  cos,
  float,
  floor,
  fract,
  instanceIndex,
  instancedArray,
  pow,
  sin,
  storage,
  uint,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_NODES } from './boxTree';

export function createTreeUniforms() {
  return {
    driftBias: uniform(0),
    seed: uniform(0, 'uint'),
    levels: uniform(14),
    placementDrift: uniform(new THREE.Vector3()),
    placementFrequency: uniform(21),
    placementPhase: uniform(new THREE.Vector3(0, 3, 2)),
    rootRadius: uniform(new THREE.Vector3(4, 2, 4)),
    shrink: uniform(0.75),
    shrinkJitter: uniform(0.2),
    sizeDrift: uniform(new THREE.Vector3()),
    sizeFrequency: uniform(31),
    sizePhase: uniform(new THREE.Vector3(1, 2, 4)),
  };
}

const TAU = Math.PI * 2;
// 710 is 113 full turns plus this sliver, which lets the integer part of an
// angle be wrapped exactly with integer arithmetic.
const WRAP = 710;
const WRAP_SLIVER = WRAP - 113 * TAU;

// Returns id * frequency wrapped to a small angle with the same sine. GPU sin
// of a raw argument near 1e6 collapses: on Dawn every node at a level came out
// as one of ~4 values, so trees lost their gaps and seeded trees went flat.
export function wrappedAngle(id, frequency) {
  const turns = id.mul(uint(floor(frequency)));
  const whole = float(turns.mod(uint(WRAP))).add(
    float(turns.div(uint(WRAP))).mul(WRAP_SLIVER)
  );
  const part = float(id).mul(fract(frequency));
  return whole.add(part.sub(floor(part.div(TAU)).mul(TAU)));
}

// sin(a + phase) expanded so a drifting phase is never added to `a` itself,
// where float32 rounding would make it move in visible jumps.
export function sinShifted(a, phase) {
  return sin(a)
    .mul(cos(phase))
    .add(cos(a).mul(sin(phase)));
}

// Heap layout: node id's children are 2id and 2id + 1, id 0 is unused. Each node
// re-walks its root path, so one dispatch needs no level ordering.
export default function createTreeCompute() {
  const u = createTreeUniforms();
  const centers = instancedArray(MAX_NODES, 'vec4').setName('boxCenters');
  const radii = instancedArray(MAX_NODES, 'vec4').setName('boxRadii');

  const kernel = Fn(() => {
    const id = instanceIndex.toVar();

    If(id.greaterThan(uint(0)), () => {
      const walk = id.toVar();
      const depth = uint(0).toVar();
      Loop(walk.greaterThan(uint(1)), () => {
        walk.shiftRightAssign(uint(1));
        depth.addAssign(uint(1));
      });

      const cen = vec3(0).toVar();
      const rad = vec3(u.rootRadius).toVar();

      Loop({ start: uint(0), end: depth, type: 'uint' }, ({ i }) => {
        const bb = id.shiftRight(depth.sub(uint(1)).sub(i)).add(u.seed);
        const weight = pow(float(i.add(uint(1))).div(u.levels), u.driftBias);

        const ra = sinShifted(
          vec3(wrappedAngle(bb, u.placementFrequency)),
          u.placementPhase.add(u.placementDrift.mul(weight))
        );
        const rb = sinShifted(
          vec3(wrappedAngle(bb, u.sizeFrequency)),
          u.sizePhase.add(u.sizeDrift.mul(weight))
        );
        const nrad = rad.mul(rb.mul(u.shrinkJitter).add(u.shrink)).toVar();
        cen.addAssign(rad.sub(nrad).mul(ra));
        rad.assign(nrad);
      });

      centers.element(id).assign(vec4(cen, 1));
      radii.element(id).assign(vec4(rad, 1));
    });
  })().compute(MAX_NODES);

  return {
    centers: storage(centers.value, 'vec4', MAX_NODES).toReadOnly(),
    kernel,
    radii: storage(radii.value, 'vec4', MAX_NODES).toReadOnly(),
    uniforms: u,
    run(renderer, levels) {
      kernel.count = 2 ** (levels + 1);
      renderer.compute(kernel);
    },
  };
}
