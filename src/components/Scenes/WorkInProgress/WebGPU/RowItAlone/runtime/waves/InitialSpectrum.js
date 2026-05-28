import { instanceIndex, storage, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  InitialSpectrumWGSL,
  InitialSpectrumWithInverseWGSL,
} from '../shaders/ifftShaders';

export default class InitialSpectrum {
  constructor(params) {
    this.params = params;
    this.init(params);
  }

  init(params) {
    this.squareSize = params.size ** 2;
    this.bufferSize = this.squareSize * 4;
    this.spectrumBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      4
    );
    this.waveDataBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(this.bufferSize),
      4
    );

    this.initialSpectrum = InitialSpectrumWGSL({
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
      size: params.size,
      waveLength: uniform(params.lengthScale),
      boundaryLow: uniform(params.boundaryLow),
      boundaryHigh: uniform(params.boundaryHigh),
      ...params.waveSettings,
    }).compute(this.squareSize);

    this.initialSpectrumWithInverse = InitialSpectrumWithInverseWGSL({
      spectrumBuffer: storage(
        this.spectrumBuffer,
        'vec4',
        this.spectrumBuffer.count
      ),
      index: instanceIndex,
      size: params.size,
    }).compute(this.squareSize);

    params.renderer.compute(this.initialSpectrum);
    params.renderer.compute(this.initialSpectrumWithInverse);
  }

  update() {
    this.params.renderer.compute(this.initialSpectrum);
    this.params.renderer.compute(this.initialSpectrumWithInverse);
  }
}
