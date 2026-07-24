import {
  Fn,
  If,
  Loop,
  Return,
  array,
  atomicAdd,
  clamp,
  float,
  instanceIndex,
  instancedArray,
  int,
  ivec3,
  mat3,
  max,
  mix,
  pow,
  time,
  uint,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import StructuredArray from './StructuredArray';
import hsvtorgb from './hsv';
import triNoise3Dvec from './noise';

const DEFAULT_GRID = 64;

export default class MlsMpmSimulator {
  numParticles = 0;

  fixedPointMultiplier = 1e7;

  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.maxParticles = options.maxParticles ?? 8192 * 8;
    this.maxAttractors = options.maxAttractors ?? 24;
    this.gridSize = new THREE.Vector3(DEFAULT_GRID, DEFAULT_GRID, DEFAULT_GRID);
    this.uniforms = {};
    this.kernels = {};
  }

  async init() {
    const particleStruct = {
      position: { type: 'vec3' },
      density: { type: 'float' },
      velocity: { type: 'vec3' },
      mass: { type: 'float' },
      C: { type: 'mat3' },
      direction: { type: 'vec3' },
      color: { type: 'vec3' },
    };

    this.particleBuffer = new StructuredArray(
      particleStruct,
      this.maxParticles,
      'apparitionsParticleData'
    );

    const vec = new THREE.Vector3();
    for (let i = 0; i < this.maxParticles; i += 1) {
      let dist = 2;
      while (dist > 1) {
        vec
          .set(Math.random(), Math.random(), Math.random())
          .multiplyScalar(2)
          .subScalar(1);
        dist = vec.length();
        vec
          .multiplyScalar(0.8)
          .addScalar(1)
          .divideScalar(2)
          .multiply(this.gridSize);
      }
      const mass = 1 - Math.random() * 0.002;
      this.particleBuffer.set(i, 'position', vec);
      this.particleBuffer.set(i, 'mass', mass);
    }

    const cellCount = this.gridSize.x * this.gridSize.y * this.gridSize.z;
    const cellStruct = {
      x: { type: 'int', atomic: true },
      y: { type: 'int', atomic: true },
      z: { type: 'int', atomic: true },
      mass: { type: 'int', atomic: true },
    };

    this.cellBuffer = new StructuredArray(
      cellStruct,
      cellCount,
      'apparitionsCellData'
    );
    this.cellBufferF = instancedArray(cellCount, 'vec4').setName(
      'apparitionsCellDataF'
    );

    this.uniforms.numParticles = uniform(0, 'uint');
    this.uniforms.dt = uniform(0.1);
    this.uniforms.noise = uniform(1);
    this.uniforms.stiffness = uniform(3);
    this.uniforms.restDensity = uniform(1);
    this.uniforms.dynamicViscosity = uniform(0.1);
    this.uniforms.gravity = uniform(new THREE.Vector3(0, 0, 0));
    this.uniforms.gridSize = uniform(this.gridSize, 'ivec3');
    // attractorMode survives only as an optional GLOBAL polarity multiplier
    // (drives the attract/repel gesture toggle). Per-attractor polarity now
    // lives in the SIGN of each attractor strength.
    this.uniforms.attractorMode = uniform(1);
    this.uniforms.attractorRadius = uniform(8);
    // Per-person colour ownership: how strongly nearby attractor hues bleed into
    // a particle's colour (0 = ignore, classic density hue only).
    this.uniforms.hueBlend = uniform(1);

    this.uniforms.attractorPositions = [];
    this.uniforms.attractorStrengths = [];
    this.uniforms.attractorRadii = [];
    this.uniforms.attractorHues = [];
    for (let i = 0; i < this.maxAttractors; i += 1) {
      this.uniforms.attractorPositions.push(
        uniform(new THREE.Vector3(9999, 9999, 9999))
      );
      this.uniforms.attractorStrengths.push(uniform(0));
      this.uniforms.attractorRadii.push(uniform(8));
      // hue < 0 ⇒ this attractor contributes force but no colour.
      this.uniforms.attractorHues.push(uniform(-1));
    }

    const encodeFixedPoint = (f32) => int(f32.mul(this.fixedPointMultiplier));
    const decodeFixedPoint = (i32) => float(i32).div(this.fixedPointMultiplier);

    const getCellPtr = (ipos) => {
      const gs = this.uniforms.gridSize;
      return int(ipos.x)
        .mul(gs.y)
        .mul(gs.z)
        .add(int(ipos.y).mul(gs.z))
        .add(int(ipos.z))
        .toConst();
    };

    const getCell = (ipos) => this.cellBuffer.element(getCellPtr(ipos));

    this.kernels.clearGrid = Fn(() => {
      this.cellBuffer.setAtomic('x', false);
      this.cellBuffer.setAtomic('y', false);
      this.cellBuffer.setAtomic('z', false);
      this.cellBuffer.setAtomic('mass', false);

      If(instanceIndex.greaterThanEqual(uint(cellCount)), () => {
        Return();
      });

      this.cellBuffer.element(instanceIndex).get('x').assign(0);
      this.cellBuffer.element(instanceIndex).get('y').assign(0);
      this.cellBuffer.element(instanceIndex).get('z').assign(0);
      this.cellBuffer.element(instanceIndex).get('mass').assign(0);
      this.cellBufferF.element(instanceIndex).assign(0);
    })().compute(cellCount);

    this.kernels.p2g1 = Fn(() => {
      this.cellBuffer.setAtomic('x', true);
      this.cellBuffer.setAtomic('y', true);
      this.cellBuffer.setAtomic('z', true);
      this.cellBuffer.setAtomic('mass', true);

      If(
        instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)),
        () => {
          Return();
        }
      );

      const particlePosition = this.particleBuffer
        .element(instanceIndex)
        .get('position')
        .xyz.toConst('particlePosition');
      const particleVelocity = this.particleBuffer
        .element(instanceIndex)
        .get('velocity')
        .xyz.toConst('particleVelocity');

      const cellIndex = ivec3(particlePosition).sub(1).toConst('cellIndex');
      const cellDiff = particlePosition.fract().sub(0.5).toConst('cellDiff');
      const w0 = float(0.5)
        .mul(float(0.5).sub(cellDiff))
        .mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5)
        .mul(float(0.5).add(cellDiff))
        .mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst('weights');

      const C = this.particleBuffer.element(instanceIndex).get('C').toConst();

      Loop(
        { start: 0, end: 3, type: 'int', name: 'gx', condition: '<' },
        ({ gx }) => {
          Loop(
            { start: 0, end: 3, type: 'int', name: 'gy', condition: '<' },
            ({ gy }) => {
              Loop(
                { start: 0, end: 3, type: 'int', name: 'gz', condition: '<' },
                ({ gz }) => {
                  const weight = weights
                    .element(gx)
                    .x.mul(weights.element(gy).y)
                    .mul(weights.element(gz).z);
                  const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
                  const cellDist = vec3(cellX)
                    .add(0.5)
                    .sub(particlePosition)
                    .toConst('cellDist');
                  const Q = C.mul(cellDist);

                  const massContrib = weight;
                  const velContrib = massContrib
                    .mul(particleVelocity.add(Q))
                    .toConst('velContrib');
                  const cell = getCell(cellX);
                  atomicAdd(cell.get('x'), encodeFixedPoint(velContrib.x));
                  atomicAdd(cell.get('y'), encodeFixedPoint(velContrib.y));
                  atomicAdd(cell.get('z'), encodeFixedPoint(velContrib.z));
                  atomicAdd(cell.get('mass'), encodeFixedPoint(massContrib));
                }
              );
            }
          );
        }
      );
    })().compute(1);

    this.kernels.p2g2 = Fn(() => {
      this.cellBuffer.setAtomic('x', true);
      this.cellBuffer.setAtomic('y', true);
      this.cellBuffer.setAtomic('z', true);
      this.cellBuffer.setAtomic('mass', false);

      If(
        instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)),
        () => {
          Return();
        }
      );

      const particlePosition = this.particleBuffer
        .element(instanceIndex)
        .get('position')
        .xyz.toConst('particlePosition');

      const cellIndex = ivec3(particlePosition).sub(1).toConst('cellIndex');
      const cellDiff = particlePosition.fract().sub(0.5).toConst('cellDiff');
      const w0 = float(0.5)
        .mul(float(0.5).sub(cellDiff))
        .mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5)
        .mul(float(0.5).add(cellDiff))
        .mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst('weights');

      const density = float(0).toVar('density');

      Loop(
        { start: 0, end: 3, type: 'int', name: 'gx', condition: '<' },
        ({ gx }) => {
          Loop(
            { start: 0, end: 3, type: 'int', name: 'gy', condition: '<' },
            ({ gy }) => {
              Loop(
                { start: 0, end: 3, type: 'int', name: 'gz', condition: '<' },
                ({ gz }) => {
                  const weight = weights
                    .element(gx)
                    .x.mul(weights.element(gy).y)
                    .mul(weights.element(gz).z);
                  const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
                  const cell = getCell(cellX);
                  density.addAssign(
                    decodeFixedPoint(cell.get('mass')).mul(weight)
                  );
                }
              );
            }
          );
        }
      );

      const densityStore = this.particleBuffer
        .element(instanceIndex)
        .get('density');
      densityStore.assign(mix(densityStore, density, 0.05));

      const volume = float(1).div(density.max(0.0001));
      const pressure = max(
        0,
        pow(density.div(this.uniforms.restDensity.max(0.0001)), 5)
          .sub(1)
          .mul(this.uniforms.stiffness)
      ).toConst('pressure');
      const stress = mat3(
        pressure.negate(),
        0,
        0,
        0,
        pressure.negate(),
        0,
        0,
        0,
        pressure.negate()
      ).toVar('stress');
      const dudv = this.particleBuffer
        .element(instanceIndex)
        .get('C')
        .toConst('C');
      const strain = dudv.add(dudv.transpose());
      stress.addAssign(strain.mul(this.uniforms.dynamicViscosity));
      const eq16Term0 = volume.mul(-4).mul(stress).mul(this.uniforms.dt);

      Loop(
        { start: 0, end: 3, type: 'int', name: 'gx', condition: '<' },
        ({ gx }) => {
          Loop(
            { start: 0, end: 3, type: 'int', name: 'gy', condition: '<' },
            ({ gy }) => {
              Loop(
                { start: 0, end: 3, type: 'int', name: 'gz', condition: '<' },
                ({ gz }) => {
                  const weight = weights
                    .element(gx)
                    .x.mul(weights.element(gy).y)
                    .mul(weights.element(gz).z);
                  const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
                  const cellDist = vec3(cellX)
                    .add(0.5)
                    .sub(particlePosition)
                    .toConst('cellDist');
                  const cell = getCell(cellX);

                  const momentum = eq16Term0
                    .mul(weight)
                    .mul(cellDist)
                    .toConst('momentum');
                  atomicAdd(cell.get('x'), encodeFixedPoint(momentum.x));
                  atomicAdd(cell.get('y'), encodeFixedPoint(momentum.y));
                  atomicAdd(cell.get('z'), encodeFixedPoint(momentum.z));
                }
              );
            }
          );
        }
      );
    })().compute(1);

    this.kernels.updateGrid = Fn(() => {
      this.cellBuffer.setAtomic('x', false);
      this.cellBuffer.setAtomic('y', false);
      this.cellBuffer.setAtomic('z', false);
      this.cellBuffer.setAtomic('mass', false);

      If(instanceIndex.greaterThanEqual(uint(cellCount)), () => {
        Return();
      });

      const cell = this.cellBuffer.element(instanceIndex).toConst('cell');
      const mass = decodeFixedPoint(cell.get('mass')).toConst();

      If(mass.lessThanEqual(0), () => {
        Return();
      });

      const vx = decodeFixedPoint(cell.get('x')).div(mass).toVar();
      const vy = decodeFixedPoint(cell.get('y')).div(mass).toVar();
      const vz = decodeFixedPoint(cell.get('z')).div(mass).toVar();

      const x = int(instanceIndex)
        .div(this.uniforms.gridSize.z)
        .div(this.uniforms.gridSize.y);
      const y = int(instanceIndex)
        .div(this.uniforms.gridSize.z)
        .mod(this.uniforms.gridSize.y);
      const z = int(instanceIndex).mod(this.uniforms.gridSize.z);

      If(
        x
          .lessThan(int(2))
          .or(x.greaterThan(this.uniforms.gridSize.x.sub(int(2)))),
        () => {
          vx.assign(0);
        }
      );
      If(
        y
          .lessThan(int(2))
          .or(y.greaterThan(this.uniforms.gridSize.y.sub(int(2)))),
        () => {
          vy.assign(0);
        }
      );
      If(
        z
          .lessThan(int(2))
          .or(z.greaterThan(this.uniforms.gridSize.z.sub(int(2)))),
        () => {
          vz.assign(0);
        }
      );

      this.cellBufferF.element(instanceIndex).assign(vec4(vx, vy, vz, mass));
    })().compute(cellCount);

    this.kernels.g2p = Fn(() => {
      If(
        instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)),
        () => {
          Return();
        }
      );

      const particleMass = this.particleBuffer
        .element(instanceIndex)
        .get('mass')
        .toConst('particleMass');
      const particleDensity = this.particleBuffer
        .element(instanceIndex)
        .get('density')
        .toConst('particleDensity');
      const particlePosition = this.particleBuffer
        .element(instanceIndex)
        .get('position')
        .xyz.toVar('particlePosition');
      const particleVelocity = vec3(0).toVar();

      particleVelocity.addAssign(this.uniforms.gravity.mul(this.uniforms.dt));

      const n = triNoise3Dvec(particlePosition.mul(0.015), time, 0.11)
        .sub(0.285)
        .normalize()
        .mul(0.28)
        .toVar();
      particleVelocity.subAssign(
        n.mul(this.uniforms.noise).mul(this.uniforms.dt)
      );

      const cellIndex = ivec3(particlePosition).sub(1).toConst('cellIndex');
      const cellDiff = particlePosition.fract().sub(0.5).toConst('cellDiff');
      const w0 = float(0.5)
        .mul(float(0.5).sub(cellDiff))
        .mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5)
        .mul(float(0.5).add(cellDiff))
        .mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst('weights');

      const B = mat3(0).toVar('B');

      Loop(
        { start: 0, end: 3, type: 'int', name: 'gx', condition: '<' },
        ({ gx }) => {
          Loop(
            { start: 0, end: 3, type: 'int', name: 'gy', condition: '<' },
            ({ gy }) => {
              Loop(
                { start: 0, end: 3, type: 'int', name: 'gz', condition: '<' },
                ({ gz }) => {
                  const weight = weights
                    .element(gx)
                    .x.mul(weights.element(gy).y)
                    .mul(weights.element(gz).z);
                  const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
                  const cellDist = vec3(cellX)
                    .add(0.5)
                    .sub(particlePosition)
                    .toConst('cellDist');
                  const cellPtr = getCellPtr(cellX);
                  const weightedVelocity = this.cellBufferF
                    .element(cellPtr)
                    .xyz.mul(weight)
                    .toConst('weightedVelocity');
                  const term = mat3(
                    weightedVelocity.mul(cellDist.x),
                    weightedVelocity.mul(cellDist.y),
                    weightedVelocity.mul(cellDist.z)
                  );
                  B.addAssign(term);
                  particleVelocity.addAssign(weightedVelocity);
                }
              );
            }
          );
        }
      );

      const attractorForce = vec3(0).toVar();
      const hueAccum = float(0).toVar();
      const hueWeight = float(0).toVar();
      for (let i = 0; i < this.maxAttractors; i += 1) {
        const attractorPos = this.uniforms.attractorPositions[i];
        const attractorStrength = this.uniforms.attractorStrengths[i];
        const attractorRadius = this.uniforms.attractorRadii[i];
        const attractorHue = this.uniforms.attractorHues[i];
        const delta = attractorPos.sub(particlePosition).toVar();
        const dist = delta.length().max(0.0001).toVar();
        // Signed strength → polarity per attractor (attract +, repel -).
        const falloff = attractorStrength
          .mul(attractorRadius)
          .div(dist.mul(dist).add(1));
        attractorForce.addAssign(delta.normalize().mul(falloff));

        // Colour ownership: nearest/strongest attractor with a valid hue wins,
        // blended by proximity. hue < 0 contributes force but no colour.
        const influence = falloff.abs();
        const hueMask = attractorHue
          .greaterThanEqual(0)
          .select(float(1), float(0));
        hueAccum.addAssign(attractorHue.mul(influence).mul(hueMask));
        hueWeight.addAssign(influence.mul(hueMask));
      }

      particleVelocity.addAssign(
        attractorForce
          .mul(this.uniforms.attractorMode)
          .mul(this.uniforms.dt)
          .mul(10)
      );
      particleVelocity.mulAssign(particleMass);

      this.particleBuffer.element(instanceIndex).get('C').assign(B.mul(4));
      particlePosition.addAssign(particleVelocity.mul(this.uniforms.dt));
      particlePosition.assign(
        clamp(particlePosition, vec3(2), this.uniforms.gridSize.sub(2))
      );

      const wallStiffness = 0.3;
      const xN = particlePosition
        .add(particleVelocity.mul(this.uniforms.dt).mul(3))
        .toConst('xN');
      const wallMin = vec3(3).toConst('wallMin');
      const wallMax = vec3(this.uniforms.gridSize).sub(3).toConst('wallMax');
      If(xN.x.lessThan(wallMin.x), () => {
        particleVelocity.x.addAssign(wallMin.x.sub(xN.x).mul(wallStiffness));
      });
      If(xN.x.greaterThan(wallMax.x), () => {
        particleVelocity.x.addAssign(wallMax.x.sub(xN.x).mul(wallStiffness));
      });
      If(xN.y.lessThan(wallMin.y), () => {
        particleVelocity.y.addAssign(wallMin.y.sub(xN.y).mul(wallStiffness));
      });
      If(xN.y.greaterThan(wallMax.y), () => {
        particleVelocity.y.addAssign(wallMax.y.sub(xN.y).mul(wallStiffness));
      });
      If(xN.z.lessThan(wallMin.z), () => {
        particleVelocity.z.addAssign(wallMin.z.sub(xN.z).mul(wallStiffness));
      });
      If(xN.z.greaterThan(wallMax.z), () => {
        particleVelocity.z.addAssign(wallMax.z.sub(xN.z).mul(wallStiffness));
      });

      this.particleBuffer
        .element(instanceIndex)
        .get('position')
        .assign(particlePosition);
      this.particleBuffer
        .element(instanceIndex)
        .get('velocity')
        .assign(particleVelocity);

      const direction = this.particleBuffer
        .element(instanceIndex)
        .get('direction');
      direction.assign(mix(direction, particleVelocity, 0.1));

      const baseHue = particleDensity
        .div(this.uniforms.restDensity.max(0.0001))
        .mul(0.25)
        .add(time.mul(0.03))
        .fract()
        .toVar();
      const dominantHue = hueAccum.div(hueWeight.max(0.0001));
      const hueInfluence = hueWeight
        .greaterThan(0)
        .select(
          attractorForce.length().mul(this.uniforms.hueBlend).clamp(0, 1),
          float(0)
        );
      const finalHue = mix(baseHue, dominantHue, hueInfluence);

      const color = hsvtorgb(
        vec3(
          finalHue,
          particleVelocity.length().mul(0.4).clamp(0, 1).mul(0.3).add(0.7),
          attractorForce.length().mul(0.06).clamp(0.55, 1)
        )
      );
      this.particleBuffer.element(instanceIndex).get('color').assign(color);
    })().compute(1);

    this.kernelsPipeline = [
      this.kernels.clearGrid,
      this.kernels.p2g1,
      this.kernels.p2g2,
      this.kernels.updateGrid,
      this.kernels.g2p,
    ];
  }

  // attractors: [{ position, strength (signed), radius?, hue? }]
  // options: { mode: 'attract' | 'repel', radius: number (default radius) }
  setAttractors(attractors, options = {}) {
    const { mode = 'attract', radius = 8 } = options;
    const count = Math.min(this.maxAttractors, attractors.length);
    for (let i = 0; i < this.maxAttractors; i += 1) {
      const a = i < count ? attractors[i] : null;
      if (!a) {
        this.uniforms.attractorPositions[i].value.set(9999, 9999, 9999);
        this.uniforms.attractorStrengths[i].value = 0;
        this.uniforms.attractorRadii[i].value = radius;
        this.uniforms.attractorHues[i].value = -1;
      } else {
        this.uniforms.attractorPositions[i].value.copy(a.position);
        this.uniforms.attractorStrengths[i].value = a.strength;
        this.uniforms.attractorRadii[i].value = a.radius ?? radius;
        this.uniforms.attractorHues[i].value = a.hue ?? -1;
      }
    }
    this.uniforms.attractorMode.value = mode === 'repel' ? -1 : 1;
    this.uniforms.attractorRadius.value = radius;
  }

  updateConfig(config) {
    this.uniforms.noise.value = config.noise;
    this.uniforms.stiffness.value = config.stiffness;
    this.uniforms.restDensity.value = config.restDensity;
    this.uniforms.dynamicViscosity.value = config.dynamicViscosity;
    this.uniforms.gravity.value.copy(config.gravity);

    if (config.hueBlend !== undefined) {
      this.uniforms.hueBlend.value = config.hueBlend;
    }

    if (config.particles !== this.numParticles) {
      this.numParticles = config.particles;
      this.uniforms.numParticles.value = config.particles;
      // r185: renderer.compute(kernel, count) no longer overrides dispatch — the
      // per-particle kernels (created with .compute(1)) run a single invocation
      // unless their own .count is set, leaving every particle but #0 unsimulated.
      this.kernels.p2g1.count = config.particles;
      this.kernels.p2g2.count = config.particles;
      this.kernels.g2p.count = config.particles;
    }

    // Flow bakes speed into the timestep so it scales the whole solve
    // (forces + advection), not just position advection.
    this.uniforms.dt.value = Math.min(config.delta, 1 / 60) * 6 * config.speed;
  }

  step() {
    if (!this.renderer) return;
    // One batched compute() = one pass + one queue submit for the whole
    // dependency chain; five separate calls would submit five times per frame.
    this.renderer.compute(this.kernelsPipeline);
  }
}
