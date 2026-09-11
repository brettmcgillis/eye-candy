import { instancedArray, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import StructuredArray from '@utils/StructuredArray';

import createGridIndex from './flipGrid';
import {
  createBoundary,
  createDivergence,
  createForces,
  createPressureSweep,
  createProjection,
} from './flipProject';
import {
  createAdvect,
  createClearPasses,
  createGridToParticle,
  createParticleToGrid,
} from './flipTransfer';

const DEFAULT_GRID = 64;
const ATOMIC_CELL = {
  x: { type: 'int', atomic: true },
  y: { type: 'int', atomic: true },
  z: { type: 'int', atomic: true },
  w: { type: 'int', atomic: true },
};

export default class FlipSimulator {
  particleCount = 0;

  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.n = options.gridSize ?? DEFAULT_GRID;
    this.maxParticles = options.maxParticles ?? 8192 * 8;
    this.hooks = {
      collide: options.collide ?? null,
      recycle: options.recycle ?? null,
      solid: options.solid ?? null,
    };
    this.seed = options.seed ?? null;
    this.grid = createGridIndex(this.n);
    this.uniforms = {};
    this.iterations = 0;
  }

  async init() {
    const { cellCount, velCount } = this.grid;

    const positions = new Float32Array(this.maxParticles * 4);
    const vec = new THREE.Vector3();
    for (let i = 0; i < this.maxParticles; i += 1) {
      if (this.seed) this.seed(i, vec, this.n);
      else
        vec
          .set(Math.random(), Math.random(), Math.random())
          .multiplyScalar(this.n);
      positions[i * 4] = vec.x;
      positions[i * 4 + 1] = vec.y;
      positions[i * 4 + 2] = vec.z;
      positions[i * 4 + 3] = 1;
    }

    this.buffers = {
      divergence: instancedArray(cellCount, 'float').setName('flipDivergence'),
      extra: instancedArray(this.maxParticles, 'vec4').setName('flipExtra'),
      gridVel: instancedArray(velCount, 'vec4').setName('flipGridVel'),
      gridVelOrig: instancedArray(velCount, 'vec4').setName('flipGridVelOrig'),
      marker: instancedArray(cellCount, 'int').setName('flipMarker'),
      positions: instancedArray(positions, 'vec4').setName('flipPositions'),
      pressure: instancedArray(cellCount, 'float').setName('flipPressure'),
      velAccum: new StructuredArray(ATOMIC_CELL, velCount, 'flipVelAccum'),
      velocities: instancedArray(this.maxParticles, 'vec4').setName('flipVel'),
      weightAccum: new StructuredArray(
        ATOMIC_CELL,
        velCount,
        'flipWeightAccum'
      ),
    };

    this.uniforms = {
      densityCorrection: uniform(1),
      dt: uniform(1 / 60),
      fluidity: uniform(0.96),
      gravity: uniform(90),
      particleCount: uniform(0, 'uint'),
      // The solver's own clock: TSL's `time` is a render-group uniform and
      // stays frozen inside compute passes.
      phase: uniform(0),
      targetDensity: uniform(2),
      turbulence: uniform(0.05),
    };

    const ctx = {
      buffers: this.buffers,
      grid: this.grid,
      hooks: this.hooks,
      n: this.n,
      uniforms: this.uniforms,
    };

    const { clearCells, clearVelocity, setAtomic } = createClearPasses(ctx);
    const { markFluid, normalise, transfer } = createParticleToGrid(
      ctx,
      setAtomic
    );

    this.kernels = {
      advect: createAdvect(ctx),
      boundary: createBoundary(ctx),
      clearCells,
      clearVelocity,
      divergence: createDivergence(ctx),
      forces: createForces(ctx),
      gather: createGridToParticle(ctx),
      markFluid,
      normalise,
      projection: createProjection(ctx),
      sweepBlack: createPressureSweep(ctx, 1),
      sweepRed: createPressureSweep(ctx, 0),
      transfer,
    };

    this.setIterations(20);
  }

  setIterations(count) {
    if (count === this.iterations) return;
    this.iterations = count;
    const k = this.kernels;
    const sweeps = [];
    for (let i = 0; i < count; i += 1) sweeps.push(k.sweepRed, k.sweepBlack);

    this.pipeline = [
      k.clearVelocity,
      k.clearCells,
      k.transfer,
      k.markFluid,
      k.normalise,
      k.forces,
      k.boundary,
      k.divergence,
      ...sweeps,
      k.projection,
      k.boundary,
      k.gather,
      k.advect,
    ];
  }

  updateConfig(config) {
    const u = this.uniforms;
    u.densityCorrection.value = config.densityCorrection;
    u.fluidity.value = config.fluidity;
    u.gravity.value = config.gravity;
    u.targetDensity.value = config.targetDensity;
    u.turbulence.value = config.turbulence;

    if (config.particles !== this.particleCount) {
      this.particleCount = config.particles;
      u.particleCount.value = config.particles;
      // r185: a kernel built with .compute(1) runs a single invocation unless
      // its own .count is set.
      this.kernels.transfer.count = config.particles;
      this.kernels.markFluid.count = config.particles;
      this.kernels.gather.count = config.particles;
      this.kernels.advect.count = config.particles;
    }

    this.setIterations(config.pressureIterations);

    const delta = Math.min(config.delta, 1 / 30) * config.speed;
    u.dt.value = delta;
    u.phase.value += delta;
  }

  step() {
    if (!this.renderer) return;
    this.renderer.compute(this.pipeline);
  }
}
