/* eslint-disable import/no-unresolved, no-bitwise */

/* global GPUBufferUsage, GPUColorWrite, GPUTextureUsage */
import depthMapWGSL from './depthMap.wgsl?raw';
import fluidWGSL from './fluid.wgsl?raw';
import fullScreenWGSL from './fullScreen.wgsl?raw';
import gaussianWGSL from './gaussian.wgsl?raw';
import narrowRangeFilterWGSL from './narrowRangeFilter.wgsl?raw';
import sphereWGSL from './sphere.wgsl?raw';
import thicknessMapWGSL from './thicknessMap.wgsl?raw';

const FLUID_PARAMS_BYTES = 16;
const FILTER_DIRECTION_BYTES = 8;
const FILTER_SIZE_BYTES = 4;
const RENDER_UNIFORMS_BYTES = 336;

function buildRenderViews(buffer) {
  return {
    invProjectionMatrix: new Float32Array(buffer, 80, 16),
    invViewMatrix: new Float32Array(buffer, 208, 16),
    modelMatrix: new Float32Array(buffer, 272, 16),
    projectionMatrix: new Float32Array(buffer, 16, 16),
    sphereSize: new Float32Array(buffer, 8, 2),
    texelSize: new Float32Array(buffer, 0, 2),
    viewMatrix: new Float32Array(buffer, 144, 16),
  };
}

export default class SplashFluidRenderer {
  constructor({
    device,
    format,
    particleDiameter,
    posvelBuffer,
    sceneDepthTexture,
    width,
    height,
    fovRadians,
  }) {
    this.device = device;
    this.format = format;
    this.particleDiameter = particleDiameter;
    this.posvelBuffer = posvelBuffer;
    this.sceneDepthTexture = sceneDepthTexture;
    this.fovRadians = fovRadians;
    this.renderValues = new ArrayBuffer(RENDER_UNIFORMS_BYTES);
    this.renderViews = buildRenderViews(this.renderValues);
    this.renderUniformBuffer = device.createBuffer({
      label: 'fish-tank-splash-render-uniforms',
      size: RENDER_UNIFORMS_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.fluidParamsBuffer = device.createBuffer({
      label: 'fish-tank-splash-fluid-params',
      size: FLUID_PARAMS_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.filterXBuffer = device.createBuffer({
      label: 'fish-tank-splash-filter-x',
      size: FILTER_DIRECTION_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.filterYBuffer = device.createBuffer({
      label: 'fish-tank-splash-filter-y',
      size: FILTER_DIRECTION_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.thicknessFilterSizeBuffer = device.createBuffer({
      label: 'fish-tank-splash-thickness-filter-size',
      size: FILTER_SIZE_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(
      this.filterXBuffer,
      0,
      new Float32Array([1, 0])
    );
    this.device.queue.writeBuffer(
      this.filterYBuffer,
      0,
      new Float32Array([0, 1])
    );
    this.device.queue.writeBuffer(
      this.thicknessFilterSizeBuffer,
      0,
      new Int32Array([15])
    );
    this.fullScreenModule = device.createShaderModule({ code: fullScreenWGSL });
    this.depthMapModule = device.createShaderModule({ code: depthMapWGSL });
    this.thicknessMapModule = device.createShaderModule({
      code: thicknessMapWGSL,
    });
    this.depthFilterModule = device.createShaderModule({
      code: narrowRangeFilterWGSL,
    });
    this.gaussianModule = device.createShaderModule({ code: gaussianWGSL });
    this.fluidModule = device.createShaderModule({ code: fluidWGSL });
    this.sphereModule = device.createShaderModule({ code: sphereWGSL });
    this.sceneDepthTextureView = sceneDepthTexture.createView({
      aspect: 'depth-only',
    });
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this.resize(width, height);
  }

  createPipelines() {
    const thicknessWidth = Math.max(1, Math.round(this.width / 2));
    const thicknessHeight = Math.max(1, Math.round(this.height / 2));
    const blurFilterSize = 12;
    const screenConstants = {
      screenHeight: this.height,
      screenWidth: this.width,
    };
    const filterConstants = {
      maxFilterSize: 50,
      projectedParticleConstant:
        (blurFilterSize * this.particleDiameter * 0.05 * (this.height / 2)) /
        Math.max(Math.tan(this.fovRadians / 2), 0.001),
    };

    this.depthMapPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-depth-map',
      layout: 'auto',
      vertex: { module: this.depthMapModule },
      fragment: {
        module: this.depthMapModule,
        targets: [{ format: 'r32float' }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: {
        depthCompare: 'less',
        depthWriteEnabled: true,
        format: 'depth32float',
      },
    });
    this.spherePipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-sphere',
      layout: 'auto',
      vertex: { module: this.sphereModule },
      fragment: {
        module: this.sphereModule,
        targets: [{ format: this.format }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: {
        depthCompare: 'less',
        depthWriteEnabled: true,
        format: 'depth32float',
      },
    });
    this.depthFilter1DPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-depth-filter-1d',
      layout: 'auto',
      vertex: {
        module: this.fullScreenModule,
        constants: screenConstants,
      },
      fragment: {
        module: this.depthFilterModule,
        constants: {
          ...filterConstants,
          blur2D: 0,
        },
        targets: [{ format: 'r32float' }],
      },
      primitive: { topology: 'triangle-list' },
    });
    this.depthFilter2DPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-depth-filter-2d',
      layout: 'auto',
      vertex: {
        module: this.fullScreenModule,
        constants: screenConstants,
      },
      fragment: {
        module: this.depthFilterModule,
        constants: {
          ...filterConstants,
          blur2D: 1,
        },
        targets: [{ format: 'r32float' }],
      },
      primitive: { topology: 'triangle-list' },
    });
    this.thicknessMapPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-thickness-map',
      layout: 'auto',
      vertex: { module: this.thicknessMapModule },
      fragment: {
        module: this.thicknessMapModule,
        targets: [
          {
            blend: {
              alpha: {
                dstFactor: 'one',
                operation: 'add',
                srcFactor: 'one',
              },
              color: {
                dstFactor: 'one',
                operation: 'add',
                srcFactor: 'one',
              },
            },
            format: 'r16float',
            writeMask: GPUColorWrite.RED,
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });
    this.thicknessFilterPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-thickness-filter',
      layout: 'auto',
      vertex: {
        module: this.fullScreenModule,
        constants: screenConstants,
      },
      fragment: {
        module: this.gaussianModule,
        constants: {
          thicknessTextureHeight: thicknessHeight,
          thicknessTextureWidth: thicknessWidth,
        },
        targets: [{ format: 'r16float' }],
      },
      primitive: { topology: 'triangle-list' },
    });
    this.fluidPipeline = this.device.createRenderPipeline({
      label: 'fish-tank-splash-fluid',
      layout: 'auto',
      vertex: {
        module: this.fullScreenModule,
        constants: screenConstants,
      },
      fragment: {
        module: this.fluidModule,
        targets: [{ format: this.format }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createTextures() {
    const thicknessWidth = Math.max(1, Math.round(this.width / 2));
    const thicknessHeight = Math.max(1, Math.round(this.height / 2));

    this.depthMapTexture = this.device.createTexture({
      label: 'fish-tank-splash-depth-map-texture',
      size: [this.width, this.height, 1],
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'r32float',
    });
    this.tmpDepthMapTexture = this.device.createTexture({
      label: 'fish-tank-splash-depth-map-texture-tmp',
      size: [this.width, this.height, 1],
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'r32float',
    });
    this.thicknessTexture = this.device.createTexture({
      label: 'fish-tank-splash-thickness-texture',
      size: [thicknessWidth, thicknessHeight, 1],
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'r16float',
    });
    this.tmpThicknessTexture = this.device.createTexture({
      label: 'fish-tank-splash-thickness-texture-tmp',
      size: [thicknessWidth, thicknessHeight, 1],
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'r16float',
    });
    this.depthTestTexture = this.device.createTexture({
      label: 'fish-tank-splash-depth-test',
      size: [this.width, this.height, 1],
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'depth32float',
    });
    this.backgroundTexture = this.device.createTexture({
      label: 'fish-tank-splash-background',
      size: [this.width, this.height, 1],
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
      format: this.format,
    });

    this.depthMapTextureView = this.depthMapTexture.createView();
    this.tmpDepthMapTextureView = this.tmpDepthMapTexture.createView();
    this.thicknessTextureView = this.thicknessTexture.createView();
    this.tmpThicknessTextureView = this.tmpThicknessTexture.createView();
    this.depthTestTextureView = this.depthTestTexture.createView();
    this.backgroundTextureView = this.backgroundTexture.createView();
  }

  createBindGroups() {
    this.depthMapBindGroup = this.device.createBindGroup({
      layout: this.depthMapPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.posvelBuffer } },
        { binding: 1, resource: { buffer: this.renderUniformBuffer } },
      ],
    });
    this.thicknessMapBindGroup = this.device.createBindGroup({
      layout: this.thicknessMapPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.posvelBuffer } },
        { binding: 1, resource: { buffer: this.renderUniformBuffer } },
      ],
    });
    this.sphereBindGroup = this.device.createBindGroup({
      layout: this.spherePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.posvelBuffer } },
        { binding: 1, resource: { buffer: this.renderUniformBuffer } },
      ],
    });
    this.depthFilterBindGroups = [
      this.device.createBindGroup({
        layout: this.depthFilter1DPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 1, resource: this.depthMapTextureView },
          { binding: 2, resource: { buffer: this.filterXBuffer } },
        ],
      }),
      this.device.createBindGroup({
        layout: this.depthFilter1DPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 1, resource: this.tmpDepthMapTextureView },
          { binding: 2, resource: { buffer: this.filterYBuffer } },
        ],
      }),
      this.device.createBindGroup({
        layout: this.depthFilter2DPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 1, resource: this.depthMapTextureView },
          { binding: 2, resource: { buffer: this.filterXBuffer } },
        ],
      }),
      this.device.createBindGroup({
        layout: this.depthFilter2DPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 1, resource: this.tmpDepthMapTextureView },
          { binding: 2, resource: { buffer: this.filterYBuffer } },
        ],
      }),
    ];
    this.thicknessFilterBindGroups = [
      this.device.createBindGroup({
        layout: this.thicknessFilterPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.sampler },
          { binding: 1, resource: this.thicknessTextureView },
          { binding: 2, resource: { buffer: this.filterXBuffer } },
          { binding: 3, resource: { buffer: this.thicknessFilterSizeBuffer } },
        ],
      }),
      this.device.createBindGroup({
        layout: this.thicknessFilterPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.sampler },
          { binding: 1, resource: this.tmpThicknessTextureView },
          { binding: 2, resource: { buffer: this.filterYBuffer } },
          { binding: 3, resource: { buffer: this.thicknessFilterSizeBuffer } },
        ],
      }),
    ];
    this.fluidBindGroup = this.device.createBindGroup({
      layout: this.fluidPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: this.depthMapTextureView },
        { binding: 2, resource: { buffer: this.renderUniformBuffer } },
        { binding: 3, resource: this.thicknessTextureView },
        { binding: 4, resource: this.backgroundTextureView },
        { binding: 5, resource: { buffer: this.fluidParamsBuffer } },
        { binding: 6, resource: this.sceneDepthTextureView },
      ],
    });
  }

  resize(width, height) {
    if (this.width === width && this.height === height) {
      return;
    }

    this.destroyTextures();
    this.width = width;
    this.height = height;
    this.createPipelines();
    this.createTextures();
    this.createBindGroups();
  }

  destroyTextures() {
    this.backgroundTexture?.destroy?.();
    this.depthMapTexture?.destroy?.();
    this.depthTestTexture?.destroy?.();
    this.thicknessTexture?.destroy?.();
    this.tmpDepthMapTexture?.destroy?.();
    this.tmpThicknessTexture?.destroy?.();
  }

  update({ camera, density, fluidColor, modelMatrix, sphereSize }) {
    camera.updateMatrixWorld();
    this.renderViews.texelSize.set([1 / this.width, 1 / this.height]);
    this.renderViews.sphereSize.set([sphereSize, 0]);
    this.renderViews.projectionMatrix.set(camera.projectionMatrix.elements);
    this.renderViews.invProjectionMatrix.set(
      camera.projectionMatrixInverse.elements
    );
    this.renderViews.viewMatrix.set(camera.matrixWorldInverse.elements);
    this.renderViews.invViewMatrix.set(camera.matrixWorld.elements);
    this.renderViews.modelMatrix.set(modelMatrix.elements);
    this.device.queue.writeBuffer(
      this.renderUniformBuffer,
      0,
      this.renderValues
    );
    this.device.queue.writeBuffer(
      this.fluidParamsBuffer,
      0,
      new Float32Array([fluidColor[0], fluidColor[1], fluidColor[2], density])
    );
  }

  copyBackground(commandEncoder, sourceTexture) {
    commandEncoder.copyTextureToTexture(
      { texture: sourceTexture },
      { texture: this.backgroundTexture },
      [this.width, this.height, 1]
    );
  }

  render(
    commandEncoder,
    currentTextureView,
    particleCount,
    { showParticles = false } = {}
  ) {
    if (showParticles) {
      const spherePass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            loadOp: 'load',
            storeOp: 'store',
            view: currentTextureView,
          },
        ],
        depthStencilAttachment: {
          depthClearValue: 1,
          depthLoadOp: 'load',
          depthStoreOp: 'store',
          view: this.sceneDepthTextureView,
        },
        label: 'fish-tank-splash-sphere-pass',
      });
      spherePass.setBindGroup(0, this.sphereBindGroup);
      spherePass.setPipeline(this.spherePipeline);
      spherePass.draw(6, particleCount);
      spherePass.end();

      return;
    }

    const depthMapPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 1e6, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.depthMapTextureView,
        },
      ],
      depthStencilAttachment: {
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        view: this.depthTestTextureView,
      },
      label: 'fish-tank-splash-depth-pass',
    });
    depthMapPass.setBindGroup(0, this.depthMapBindGroup);
    depthMapPass.setPipeline(this.depthMapPipeline);
    depthMapPass.draw(6, particleCount);
    depthMapPass.end();

    for (let index = 0; index < 2; index += 1) {
      const filterXPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            clearValue: { r: 1e6, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
            view: this.tmpDepthMapTextureView,
          },
        ],
        label: 'fish-tank-splash-depth-filter-x',
      });
      filterXPass.setBindGroup(0, this.depthFilterBindGroups[0]);
      filterXPass.setPipeline(this.depthFilter1DPipeline);
      filterXPass.draw(6);
      filterXPass.end();

      const filterYPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            clearValue: { r: 1e6, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
            view: this.depthMapTextureView,
          },
        ],
        label: `fish-tank-splash-depth-filter-y-${index}`,
      });
      filterYPass.setBindGroup(0, this.depthFilterBindGroups[1]);
      filterYPass.setPipeline(this.depthFilter1DPipeline);
      filterYPass.draw(6);
      filterYPass.end();
    }

    const depthFilter2DXPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 1e6, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.tmpDepthMapTextureView,
        },
      ],
      label: 'fish-tank-splash-depth-filter-2d-x',
    });
    depthFilter2DXPass.setBindGroup(0, this.depthFilterBindGroups[2]);
    depthFilter2DXPass.setPipeline(this.depthFilter2DPipeline);
    depthFilter2DXPass.draw(6);
    depthFilter2DXPass.end();

    const depthFilter2DYPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 1e6, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.depthMapTextureView,
        },
      ],
      label: 'fish-tank-splash-depth-filter-2d-y',
    });
    depthFilter2DYPass.setBindGroup(0, this.depthFilterBindGroups[3]);
    depthFilter2DYPass.setPipeline(this.depthFilter2DPipeline);
    depthFilter2DYPass.draw(6);
    depthFilter2DYPass.end();

    const thicknessPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.thicknessTextureView,
        },
      ],
      label: 'fish-tank-splash-thickness-pass',
    });
    thicknessPass.setBindGroup(0, this.thicknessMapBindGroup);
    thicknessPass.setPipeline(this.thicknessMapPipeline);
    thicknessPass.draw(6, particleCount);
    thicknessPass.end();

    const thicknessFilterXPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.tmpThicknessTextureView,
        },
      ],
      label: 'fish-tank-splash-thickness-filter-x',
    });
    thicknessFilterXPass.setBindGroup(0, this.thicknessFilterBindGroups[0]);
    thicknessFilterXPass.setPipeline(this.thicknessFilterPipeline);
    thicknessFilterXPass.draw(6);
    thicknessFilterXPass.end();

    const thicknessFilterYPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: this.thicknessTextureView,
        },
      ],
      label: 'fish-tank-splash-thickness-filter-y',
    });
    thicknessFilterYPass.setBindGroup(0, this.thicknessFilterBindGroups[1]);
    thicknessFilterYPass.setPipeline(this.thicknessFilterPipeline);
    thicknessFilterYPass.draw(6);
    thicknessFilterYPass.end();

    const fluidPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
          view: currentTextureView,
        },
      ],
      label: 'fish-tank-splash-fluid-pass',
    });
    fluidPass.setBindGroup(0, this.fluidBindGroup);
    fluidPass.setPipeline(this.fluidPipeline);
    fluidPass.draw(6);
    fluidPass.end();
  }

  dispose() {
    this.destroyTextures();
    this.filterXBuffer.destroy();
    this.filterYBuffer.destroy();
    this.fluidParamsBuffer.destroy();
    this.renderUniformBuffer.destroy();
    this.thicknessFilterSizeBuffer.destroy();
  }
}
