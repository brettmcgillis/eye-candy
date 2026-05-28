import {
  instanceIndex,
  localId,
  storage,
  textureStore,
  uint,
  uniform,
  workgroupId,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  TexturesMergerWGSL,
  TimeSpectrumWGSL,
  ifftHorizontalWGSL,
  ifftInitWGSL,
  ifftPermuteWGSL,
  ifftVerticalWGSL,
} from '../shaders/ifftShaders';
import InitialSpectrum from './InitialSpectrum';
import { WORKGROUP } from './waveConstants';

export default class WaveCascade {
  constructor(params) {
    this.init(params);
  }

  init(params) {
    this.params = params;
    this.logN = Math.log2(params.size);
    this.squareSize = params.size ** 2;
    this.bufferSize = this.squareSize * 2;
    this.initialSpectrum = new InitialSpectrum(params);
    this.spectrumBuffer = this.initialSpectrum.spectrumBuffer;
    this.waveDataBuffer = this.initialSpectrum.waveDataBuffer;

    this.dxDzBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      2
    );
    this.dyDxzBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      2
    );
    this.dyxDyzBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      2
    );
    this.dxxDzzBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      2
    );
    this.pingpongBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize * 2),
      4
    );
    this.turbulenceBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize / 2),
      1
    );

    this.displacementIndex = uniform(0);
    this.ifftStep = uniform(0);
    this.pingpong = uniform(0);
    this.deltaTime = uniform(0);

    this.displacement = new THREE.StorageTexture(params.size, params.size);
    this.derivative = new THREE.StorageTexture(params.size, params.size);
    this.jacobian = new THREE.StorageTexture(params.size, params.size);

    this.displacement.type = THREE.HalfFloatType;
    this.derivative.type = THREE.HalfFloatType;
    this.jacobian.type = THREE.FloatType;

    this.displacement.generateMipmaps = true;
    this.derivative.generateMipmaps = true;
    this.jacobian.generateMipmaps = true;

    this.displacement.magFilter = THREE.LinearFilter;
    this.derivative.magFilter = THREE.LinearFilter;
    this.jacobian.magFilter = THREE.LinearFilter;

    this.displacement.minFilter = THREE.LinearMipMapLinearFilter;
    this.derivative.minFilter = THREE.LinearMipMapLinearFilter;
    this.jacobian.minFilter = THREE.LinearMipMapLinearFilter;

    this.displacement.wrapS = THREE.RepeatWrapping;
    this.displacement.wrapT = THREE.RepeatWrapping;
    this.derivative.wrapS = THREE.RepeatWrapping;
    this.derivative.wrapT = THREE.RepeatWrapping;
    this.jacobian.wrapS = THREE.RepeatWrapping;
    this.jacobian.wrapT = THREE.RepeatWrapping;

    this.displacement.anisotropy = this.params.renderer.getMaxAnisotropy();
    this.derivative.anisotropy = this.params.renderer.getMaxAnisotropy();
    this.jacobian.anisotropy = this.params.renderer.getMaxAnisotropy();

    this.workgroupSize = WORKGROUP;
    this.dispatchSize = [
      params.size / this.workgroupSize[0],
      params.size / this.workgroupSize[1],
    ];

    this.computeTimeSpectrum = TimeSpectrumWGSL({
      writeDxDzBuffer: storage(this.dxDzBuffer, 'vec2', this.dxDzBuffer.count),
      writeDyDxzBuffer: storage(
        this.dyDxzBuffer,
        'vec2',
        this.dyDxzBuffer.count
      ),
      writeDyxDyzBuffer: storage(
        this.dyxDyzBuffer,
        'vec2',
        this.dyxDyzBuffer.count
      ),
      writeDxxDzzBuffer: storage(
        this.dxxDzzBuffer,
        'vec2',
        this.dxxDzzBuffer.count
      ),
      spectrumBuffer: storage(
        this.spectrumBuffer,
        'vec4',
        this.spectrumBuffer.count
      ),
      waveDataBuffer: storage(
        this.waveDataBuffer,
        'vec4',
        this.waveDataBuffer.count
      ),
      index: instanceIndex,
      size: uint(params.size),
      time: uniform(0),
    }).computeKernel(this.workgroupSize);

    this.computeInitialize = ifftInitWGSL({
      size: uint(params.size),
      step: uint(this.ifftStep),
      logN: uint(this.logN),
      butterflyBuffer: storage(
        params.butterflyBuffer,
        'vec4',
        params.butterflyBuffer.count
      ).toReadOnly(),
      DxDzBuffer: storage(
        this.dxDzBuffer,
        'vec2',
        this.dxDzBuffer.count
      ).toReadOnly(),
      DyDxzBuffer: storage(
        this.dyDxzBuffer,
        'vec2',
        this.dyDxzBuffer.count
      ).toReadOnly(),
      DyxDyzBuffer: storage(
        this.dyxDyzBuffer,
        'vec2',
        this.dyxDyzBuffer.count
      ).toReadOnly(),
      DxxDzzBuffer: storage(
        this.dxxDzzBuffer,
        'vec2',
        this.dxxDzzBuffer.count
      ).toReadOnly(),
      pingpongBuffer: storage(
        this.pingpongBuffer,
        'vec4',
        this.pingpongBuffer.count
      ),
      initBufferIndex: uint(this.displacementIndex),
      index: instanceIndex,
      workgroupSize: uniform(new THREE.Vector2().fromArray(this.workgroupSize)),
      workgroupId,
      localId,
    }).computeKernel(this.workgroupSize);

    this.computeHorizontalPingPong = ifftHorizontalWGSL({
      size: uint(params.size),
      step: uint(this.ifftStep),
      logN: uint(this.logN),
      butterflyBuffer: storage(
        params.butterflyBuffer,
        'vec4',
        params.butterflyBuffer.count
      ).toReadOnly(),
      pingpongBuffer: storage(
        this.pingpongBuffer,
        'vec4',
        this.pingpongBuffer.count
      ),
      initBufferIndex: uint(this.displacementIndex),
      pingpong: uint(this.pingpong),
      index: instanceIndex,
      workgroupSize: uniform(new THREE.Vector2().fromArray(this.workgroupSize)),
      workgroupId,
      localId,
    }).computeKernel(this.workgroupSize);

    this.computeVerticalPingPong = ifftVerticalWGSL({
      size: uint(params.size),
      step: uint(this.ifftStep),
      logN: uint(this.logN),
      butterflyBuffer: storage(
        params.butterflyBuffer,
        'vec4',
        params.butterflyBuffer.count
      ).toReadOnly(),
      pingpongBuffer: storage(
        this.pingpongBuffer,
        'vec4',
        this.pingpongBuffer.count
      ),
      initBufferIndex: uint(this.displacementIndex),
      pingpong: uint(this.pingpong),
      index: instanceIndex,
      workgroupSize: uniform(new THREE.Vector2().fromArray(this.workgroupSize)),
      workgroupId,
      localId,
    }).computeKernel(this.workgroupSize);

    this.computePermute = ifftPermuteWGSL({
      size: uint(params.size),
      pingpongBuffer: storage(
        this.pingpongBuffer,
        'vec4',
        this.pingpongBuffer.count
      ).toReadOnly(),
      DxDzBuffer: storage(this.dxDzBuffer, 'vec2', this.dxDzBuffer.count),
      DyDxzBuffer: storage(this.dyDxzBuffer, 'vec2', this.dyDxzBuffer.count),
      DyxDyzBuffer: storage(this.dyxDyzBuffer, 'vec2', this.dyxDyzBuffer.count),
      DxxDzzBuffer: storage(this.dxxDzzBuffer, 'vec2', this.dxxDzzBuffer.count),
      initBufferIndex: uint(this.displacementIndex),
      index: instanceIndex,
      workgroupSize: uniform(new THREE.Vector2().fromArray(this.workgroupSize)),
      workgroupId,
      localId,
    }).computeKernel(this.workgroupSize);

    this.computeMergeTextures = TexturesMergerWGSL({
      size: uint(params.size),
      index: instanceIndex,
      lambda: uniform(params.lambda),
      deltaTime: this.deltaTime,
      DxDzBuffer: storage(
        this.dxDzBuffer,
        'vec2',
        this.dxDzBuffer.count
      ).toReadOnly(),
      DyDxzBuffer: storage(
        this.dyDxzBuffer,
        'vec2',
        this.dyDxzBuffer.count
      ).toReadOnly(),
      DyxDyzBuffer: storage(
        this.dyxDyzBuffer,
        'vec2',
        this.dyxDyzBuffer.count
      ).toReadOnly(),
      DxxDzzBuffer: storage(
        this.dxxDzzBuffer,
        'vec2',
        this.dxxDzzBuffer.count
      ).toReadOnly(),
      turbulenceBuffer: storage(
        this.turbulenceBuffer,
        'float',
        this.turbulenceBuffer.count
      ),
      writeDisplacement: textureStore(this.displacement),
      writeDerivative: textureStore(this.derivative),
      writeJacobian: textureStore(this.jacobian),
      workgroupSize: uniform(new THREE.Vector2().fromArray(this.workgroupSize)),
      workgroupId,
      localId,
    }).computeKernel(this.workgroupSize);
  }

  update(deltaTimeMs) {
    this.computeTimeSpectrum.computeNode.parameters.time.value =
      performance.now() / 1000;

    this.params.renderer.compute(this.computeTimeSpectrum, this.dispatchSize);

    this.ifft(0);
    this.ifft(1);
    this.ifft(2);
    this.ifft(3);

    this.deltaTime.value = deltaTimeMs;
    this.params.renderer.compute(this.computeMergeTextures, this.dispatchSize);
  }

  ifft(index) {
    this.displacementIndex.value = index;
    let pingpong = true;

    this.ifftStep.value = 0;
    this.params.renderer.compute(this.computeInitialize, this.dispatchSize);

    for (let stepIndex = 1; stepIndex < this.logN; stepIndex += 1) {
      pingpong = !pingpong;
      this.ifftStep.value = stepIndex;
      this.pingpong.value = pingpong ? 1 : 0;
      this.params.renderer.compute(
        this.computeHorizontalPingPong,
        this.dispatchSize
      );
    }

    for (let stepIndex = 0; stepIndex < this.logN; stepIndex += 1) {
      pingpong = !pingpong;
      this.ifftStep.value = stepIndex;
      this.pingpong.value = pingpong ? 1 : 0;
      this.params.renderer.compute(
        this.computeVerticalPingPong,
        this.dispatchSize
      );
    }

    this.params.renderer.compute(this.computePermute, this.dispatchSize);
  }
}
