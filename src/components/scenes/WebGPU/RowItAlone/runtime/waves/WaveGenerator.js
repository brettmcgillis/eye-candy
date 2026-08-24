import { instanceIndex, storage } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { butterflyWGSL } from '../shaders/ifftShaders';
import WaveCascade from './WaveCascade';
import {
  DEFAULT_WAVE_QUALITY,
  FIRST_WAVE_DATASET,
  FOAM_STRENGTH,
  FOAM_THRESHOLD,
  LAMBDA,
  LENGTH_SCALES,
  LOD_SCALE,
  SECOND_WAVE_DATASET,
  getWaveQualityPreset,
} from './waveConstants';

export default class WaveGenerator {
  constructor(params) {
    this.params = params;
    this.quality = params.quality ?? DEFAULT_WAVE_QUALITY;
  }

  init() {
    this.qualityPreset = getWaveQualityPreset(this.quality);
    this.size = this.qualityPreset.resolution;
    this.butterflyBuffer = new THREE.StorageBufferAttribute(
      new Float32Array(Math.log2(this.size) * this.size * 4),
      4
    );

    this.butterfly = butterflyWGSL({
      butterflyBuffer: storage(
        this.butterflyBuffer,
        'vec4',
        this.butterflyBuffer.count
      ),
      index: instanceIndex,
      N: this.size,
    }).compute(Math.log2(this.size) * this.size);
    this.params.renderer.compute(this.butterfly);

    this.waveSettings = {
      ...FIRST_WAVE_DATASET,
      ...SECOND_WAVE_DATASET,
    };

    this.cascades = [];
    this.foamStrength = FOAM_STRENGTH;
    this.foamThreshold = FOAM_THRESHOLD;
    this.waveLengths = LENGTH_SCALES;
    this.lambda = LAMBDA;
    this.lodScale = LOD_SCALE;

    this.initCascades();
  }

  initCascades() {
    this.cascades.length = 0;
    let boundaryLow = 0.0001;

    for (let index = 0; index < this.waveLengths.length; index += 1) {
      const boundaryHigh =
        index < this.waveLengths.length - 1
          ? ((2 * Math.PI) / this.waveLengths[index + 1]) * 6
          : 9999;

      this.cascades.push(
        new WaveCascade({
          ...this.params,
          ...this.getCascadeParams(index, boundaryLow, boundaryHigh),
        })
      );
      boundaryLow = boundaryHigh;
    }
  }

  getCascadeParams(index, boundaryLow, boundaryHigh) {
    return {
      boundaryHigh,
      boundaryLow,
      butterflyBuffer: this.butterflyBuffer,
      lambda: this.lambda[index],
      lengthScale: this.waveLengths[index],
      size: this.size,
      waveSettings: this.waveSettings,
    };
  }

  setFoamStrength(value) {
    this.foamStrength.value = value;
  }

  setFoamThreshold(value) {
    this.foamThreshold.value = value;
  }

  setLodScale(value) {
    this.lodScale.value = value;
  }

  applyWaveSettings(settings) {
    if (!settings) {
      return;
    }

    let didChange = false;

    Object.entries(settings).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(this.waveSettings, key)) {
        return;
      }

      if (this.waveSettings[key].value === value) {
        return;
      }

      this.waveSettings[key].value = value;
      didChange = true;
    });

    if (didChange) {
      this.cascades.forEach((cascade) => {
        cascade.initialSpectrum.update();
      });
    }
  }

  update(deltaTimeMs) {
    this.cascades.forEach((cascade) => {
      cascade.update(deltaTimeMs);
    });
  }

  dispose() {
    this.cascades.forEach((cascade) => {
      cascade.dispose?.();
    });
    this.cascades = [];
    this.butterflyBuffer?.dispose?.();
  }
}
