/* eslint-disable import/no-unresolved, no-bitwise */

/* global GPUBufferUsage */
import clearGridWGSL from './clearGrid.wgsl?raw';
import copyPositionWGSL from './copyPosition.wgsl?raw';
import g2pWGSL from './g2p.wgsl?raw';
import p2g1WGSL from './p2g_1.wgsl?raw';
import p2g2WGSL from './p2g_2.wgsl?raw';
import updateGridWGSL from './updateGrid.wgsl?raw';

const FIXED_POINT_MULTIPLIER = 1e7;
const INITIAL_PARTICLE_JITTER_FRACTION = 0.18;
const PARTICLE_STRUCT_SIZE = 80;
const POSVEL_STRUCT_SIZE = 32;
const CELL_STRUCT_SIZE = 16;
const SIM_UNIFORMS_BYTES = 112;
const DEFAULT_SIMULATION_SETTINGS = Object.freeze({
  dynamicViscosity: 0.1,
  gravity: 0.4,
  restDensity: 3,
  stiffness: 50,
  wallStiffness: 1,
});

function buildSimulationViews(buffer) {
  return {
    containMax: new Float32Array(buffer, 32, 4),
    containMin: new Float32Array(buffer, 16, 4),
    domainSize: new Float32Array(buffer, 0, 4),
    impulseCenter: new Float32Array(buffer, 64, 4),
    impulseDir: new Float32Array(buffer, 80, 4),
    impulseParams: new Float32Array(buffer, 96, 4),
    openSides: new Float32Array(buffer, 48, 4),
  };
}

function createInitialParticleState(config) {
  const particles = [];
  const jitterRange = config.particleSpacing * INITIAL_PARTICLE_JITTER_FRACTION;

  for (
    let y = config.initialFillMin[1];
    y < config.initialFillMax[1];
    y += config.particleSpacing
  ) {
    for (
      let x = config.initialFillMin[0];
      x < config.initialFillMax[0];
      x += config.particleSpacing
    ) {
      for (
        let z = config.initialFillMin[2];
        z < config.initialFillMax[2];
        z += config.particleSpacing
      ) {
        particles.push([
          x + (Math.random() - 0.5) * jitterRange,
          y + (Math.random() - 0.5) * jitterRange,
          z + (Math.random() - 0.5) * jitterRange,
        ]);
      }
    }
  }

  const particleCount = particles.length;
  const buffer = new ArrayBuffer(PARTICLE_STRUCT_SIZE * particleCount);

  particles.forEach((position, index) => {
    const offset = PARTICLE_STRUCT_SIZE * index;
    const positionView = new Float32Array(buffer, offset, 3);
    const velocityView = new Float32Array(buffer, offset + 16, 3);
    const affineView = new Float32Array(buffer, offset + 32, 12);

    positionView.set(position);
    velocityView.set([0, 0, 0]);
    affineView.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  return { buffer, particleCount };
}

export default class SplashFluidSimulator {
  constructor({
    config,
    device,
    simulationSettings = DEFAULT_SIMULATION_SETTINGS,
  }) {
    this.config = config;
    this.device = device;
    this.simulationSettings = {
      ...DEFAULT_SIMULATION_SETTINGS,
      ...simulationSettings,
    };
    this.simulationValues = new ArrayBuffer(SIM_UNIFORMS_BYTES);
    this.simulationViews = buildSimulationViews(this.simulationValues);

    const particleState = createInitialParticleState(config);

    this.particleCount = particleState.particleCount;
    this.gridCount =
      config.domainSize[0] * config.domainSize[1] * config.domainSize[2];
    this.cellBuffer = device.createBuffer({
      label: 'fish-tank-splash-cell-buffer',
      size: CELL_STRUCT_SIZE * this.gridCount,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.particleBuffer = device.createBuffer({
      label: 'fish-tank-splash-particle-buffer',
      size: PARTICLE_STRUCT_SIZE * this.particleCount,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.posvelBuffer = device.createBuffer({
      label: 'fish-tank-splash-posvel-buffer',
      size: POSVEL_STRUCT_SIZE * this.particleCount,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.densityBuffer = device.createBuffer({
      label: 'fish-tank-splash-density-buffer',
      size: 4 * this.particleCount,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.simulationUniformBuffer = device.createBuffer({
      label: 'fish-tank-splash-sim-uniforms',
      size: SIM_UNIFORMS_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.numParticlesBuffer = device.createBuffer({
      label: 'fish-tank-splash-num-particles',
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.particleBuffer, 0, particleState.buffer);
    this.device.queue.writeBuffer(
      this.numParticlesBuffer,
      0,
      new Int32Array([this.particleCount])
    );

    this.clearGridPipeline = device.createComputePipeline({
      label: 'fish-tank-splash-clear-grid',
      layout: 'auto',
      compute: { module: device.createShaderModule({ code: clearGridWGSL }) },
    });
    this.p2g1Pipeline = device.createComputePipeline({
      label: 'fish-tank-splash-p2g1',
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: p2g1WGSL }),
        constants: {
          fixedPointMultiplier: FIXED_POINT_MULTIPLIER,
        },
      },
    });
    this.p2g2Pipeline = device.createComputePipeline({
      label: 'fish-tank-splash-p2g2',
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: p2g2WGSL }),
        constants: {
          dynamicViscosity: this.simulationSettings.dynamicViscosity,
          fixedPointMultiplier: FIXED_POINT_MULTIPLIER,
          fixedPointMultiplierInverse: 1 / FIXED_POINT_MULTIPLIER,
          restDensity: this.simulationSettings.restDensity,
          stiffness: this.simulationSettings.stiffness,
        },
      },
    });
    this.updateGridPipeline = device.createComputePipeline({
      label: 'fish-tank-splash-update-grid',
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: updateGridWGSL }),
        constants: {
          fixedPointMultiplier: FIXED_POINT_MULTIPLIER,
          fixedPointMultiplierInverse: 1 / FIXED_POINT_MULTIPLIER,
          gravity: this.simulationSettings.gravity,
        },
      },
    });
    this.g2pPipeline = device.createComputePipeline({
      label: 'fish-tank-splash-g2p',
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: g2pWGSL }),
        constants: {
          fixedPointMultiplierInverse: 1 / FIXED_POINT_MULTIPLIER,
          wallStiffness: this.simulationSettings.wallStiffness,
        },
      },
    });
    this.copyPositionPipeline = device.createComputePipeline({
      label: 'fish-tank-splash-copy-position',
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: copyPositionWGSL }),
      },
    });

    this.clearGridBindGroup = device.createBindGroup({
      layout: this.clearGridPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.cellBuffer } }],
    });
    this.p2g1BindGroup = device.createBindGroup({
      layout: this.p2g1Pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.cellBuffer } },
        { binding: 2, resource: { buffer: this.simulationUniformBuffer } },
        { binding: 3, resource: { buffer: this.numParticlesBuffer } },
      ],
    });
    this.p2g2BindGroup = device.createBindGroup({
      layout: this.p2g2Pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.cellBuffer } },
        { binding: 2, resource: { buffer: this.simulationUniformBuffer } },
        { binding: 3, resource: { buffer: this.numParticlesBuffer } },
        { binding: 4, resource: { buffer: this.densityBuffer } },
      ],
    });
    this.updateGridBindGroup = device.createBindGroup({
      layout: this.updateGridPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.cellBuffer } },
        { binding: 1, resource: { buffer: this.simulationUniformBuffer } },
      ],
    });
    this.g2pBindGroup = device.createBindGroup({
      layout: this.g2pPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.cellBuffer } },
        { binding: 2, resource: { buffer: this.simulationUniformBuffer } },
        { binding: 3, resource: { buffer: this.numParticlesBuffer } },
      ],
    });
    this.copyPositionBindGroup = device.createBindGroup({
      layout: this.copyPositionPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.posvelBuffer } },
        { binding: 2, resource: { buffer: this.numParticlesBuffer } },
      ],
    });
  }

  update({ containMax, containMin, delta, impulse, openSides, spillFloor }) {
    this.simulationViews.domainSize.set([
      this.config.domainSize[0],
      this.config.domainSize[1],
      this.config.domainSize[2],
      0,
    ]);
    this.simulationViews.containMin.set([
      containMin[0],
      containMin[1],
      containMin[2],
      spillFloor,
    ]);
    this.simulationViews.containMax.set([
      containMax[0],
      containMax[1],
      containMax[2],
      0,
    ]);
    this.simulationViews.openSides.set([
      openSides[0],
      openSides[1],
      openSides[2],
      openSides[3],
    ]);

    if (impulse) {
      this.simulationViews.impulseCenter.set([
        impulse.center[0],
        impulse.center[1],
        impulse.center[2],
        1,
      ]);
      this.simulationViews.impulseDir.set([
        impulse.direction[0],
        impulse.direction[1],
        impulse.direction[2],
        0,
      ]);
      this.simulationViews.impulseParams.set([
        impulse.radius,
        impulse.strength,
        delta,
        0,
      ]);
    } else {
      this.simulationViews.impulseCenter.set([0, 0, 0, 0]);
      this.simulationViews.impulseDir.set([0, 0, 0, 0]);
      this.simulationViews.impulseParams.set([0, 0, delta, 0]);
    }

    this.device.queue.writeBuffer(
      this.simulationUniformBuffer,
      0,
      this.simulationValues
    );
  }

  step(commandEncoder) {
    const computePass = commandEncoder.beginComputePass({
      label: 'fish-tank-splash-compute',
    });

    computePass.setBindGroup(0, this.clearGridBindGroup);
    computePass.setPipeline(this.clearGridPipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.gridCount / 64));

    computePass.setBindGroup(0, this.p2g1BindGroup);
    computePass.setPipeline(this.p2g1Pipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 64));

    computePass.setBindGroup(0, this.p2g2BindGroup);
    computePass.setPipeline(this.p2g2Pipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 64));

    computePass.setBindGroup(0, this.updateGridBindGroup);
    computePass.setPipeline(this.updateGridPipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.gridCount / 64));

    computePass.setBindGroup(0, this.g2pBindGroup);
    computePass.setPipeline(this.g2pPipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 64));

    computePass.setBindGroup(0, this.copyPositionBindGroup);
    computePass.setPipeline(this.copyPositionPipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 64));

    computePass.end();
  }

  dispose() {
    this.cellBuffer.destroy();
    this.densityBuffer.destroy();
    this.numParticlesBuffer.destroy();
    this.particleBuffer.destroy();
    this.posvelBuffer.destroy();
    this.simulationUniformBuffer.destroy();
  }
}
