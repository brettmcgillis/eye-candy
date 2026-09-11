import {
  If,
  cos,
  float,
  hash,
  sin,
  sqrt,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { GRID, NOZZLE } from './domain';

const TAU = Math.PI * 2;
const FLOOR = 3;

// Seeded as a shallow pool the pour then feeds from. The projection keeps the
// pool incompressible on its own, so this only has to be a sane starting
// volume rather than a density the solver has to be talked into accepting.
export function poolDepth(particles, perCell = 4) {
  const floorArea = (GRID - 2 * FLOOR) ** 2;
  return Math.min(GRID * 0.4, particles / (floorArea * perCell));
}

export default function createEmitter(initial) {
  const uniforms = {
    drainHeight: uniform(initial.drainHeight),
    maxAge: uniform(initial.maxAge),
    // Probability per particle per step of being returned to the source. The
    // stream's thickness is this rate, not the source's radius.
    pourChance: uniform(0.002),
    source: uniform(new THREE.Vector3(NOZZLE.x, NOZZLE.y, NOZZLE.z)),
    sourceRadius: uniform(initial.sourceRadius),
    sourceSpeed: uniform(initial.sourceSpeed),
  };

  let angle = 0;

  const seed = (index, vec) => {
    const depth = poolDepth(initial.particles, initial.targetDensity);
    const span = GRID - 2 * FLOOR;
    vec.set(
      FLOOR + Math.random() * span,
      FLOOR + Math.random() * depth,
      FLOOR + Math.random() * span
    );
  };

  // Particles appear throughout a sphere with almost no speed of their own and
  // fall out of it under gravity, which is what makes the source read as a
  // hanging ball of fluid rather than a nozzle firing a jet.
  const recycle = ({ dt, extra, index, phase, position, velocity }) => {
    const age = extra.x.add(dt).toVar('age');
    const normalised = age.div(uniforms.maxAge).clamp(0, 1).toConst('heat');
    const salt = phase.mul(613.7).add(float(index).mul(0.7351)).toConst('salt');

    If(
      position.y
        .lessThan(uniforms.drainHeight)
        .and(hash(salt).lessThan(uniforms.pourChance)),
      () => {
        const azimuth = hash(salt.add(11.7)).mul(TAU).toConst('azimuth');
        const height = hash(salt.add(29.3)).mul(2).sub(1).toConst('height');
        const radius = hash(salt.add(53.1))
          .pow(1 / 3)
          .mul(uniforms.sourceRadius)
          .toConst('radius');
        const ring = sqrt(height.mul(height).oneMinus()).toConst('ring');

        position.assign(
          uniforms.source.add(
            vec3(ring.mul(cos(azimuth)), height, ring.mul(sin(azimuth))).mul(
              radius
            )
          )
        );
        velocity.assign(vec3(0, uniforms.sourceSpeed.negate(), 0));
        age.assign(0);
      }
    );

    extra.assign(vec4(age, normalised, 0, 0));
  };

  const update = (config, delta) => {
    angle += delta * config.sourceOrbitSpeed * TAU;

    uniforms.drainHeight.value = config.drainHeight;
    uniforms.maxAge.value = config.maxAge;
    uniforms.sourceRadius.value = config.sourceRadius;
    uniforms.sourceSpeed.value = config.sourceSpeed;
    uniforms.source.value.set(
      GRID * 0.5 +
        config.sourceOffsetX +
        Math.cos(angle) * config.sourceOrbitRadius,
      config.sourceHeight + Math.sin(angle * 2) * config.sourceOrbitBob,
      GRID * 0.5 +
        config.sourceOffsetZ +
        Math.sin(angle) * config.sourceOrbitRadius
    );
    uniforms.pourChance.value =
      (config.pourRate * Math.min(delta, 1 / 30)) / config.particles;
  };

  return { recycle, seed, uniforms, update };
}
