import { instancedArray, uniform } from 'three/tsl';

import createFieldTexture from '@utils/storageField';

import { RESOLUTION, SEA_LEVEL } from './constants';
import {
  createFloodPass,
  createFluxPass,
  createFoamPass,
  createHeightPass,
} from './waterKernels';

const N = RESOLUTION;

export default class WaterSolver {
  constructor(bedHeights) {
    this.bed = instancedArray(bedHeights, 'float').setName('shorelineBed');

    this.heights = [createFieldTexture(N, N), createFieldTexture(N, N)];
    this.flux = [createFieldTexture(N, N), createFieldTexture(N, N)];
    this.foam = [createFieldTexture(N, N), createFieldTexture(N, N)];

    this.uniforms = {
      breakHigh: uniform(0.9),
      breakLow: uniform(0.35),
      breakWeight: uniform(1),
      damping: uniform(0.995),
      drag: uniform(0.02),
      dt: uniform(1 / 120),
      foamAdvect: uniform(1),
      foamBirth: uniform(1.4),
      foamDecay: uniform(0.55),
      foamNoise: uniform(0.8),
      foamNoiseScale: uniform(18),
      phase: uniform(0),
      pipeArea: uniform(0.6),
      seaLevel: uniform(SEA_LEVEL),
      shallowDepth: uniform(2.5),
      steepWeight: uniform(1.4),
      swellAmplitude: uniform(1.6),
      swellDrive: uniform(0.35),
      swellGroupRate: uniform(0.11),
      swellPeriod: uniform(7),
      swellSpread: uniform(1),
      wetDepth: uniform(0.12),
    };

    const shared = {
      bed: this.bed,
      flux: this.flux,
      foam: this.foam,
      heights: this.heights,
      uniforms: this.uniforms,
    };

    // Substeps run as 0 -> 1 -> 0 pairs so the settled half is always index 0.
    // The water and rock materials bind that texture once and never rebind.
    this.pipelines = [0, 1].map((read) => {
      const write = 1 - read;
      const stage = { ...shared, read, write };
      return [
        createFluxPass(stage),
        createHeightPass(stage),
        createFoamPass(stage),
      ];
    });

    this.floodPasses = [0, 1].map((index) =>
      createFloodPass({ ...shared, index })
    );

    this.flooded = false;
  }

  get heightTexture() {
    return this.heights[0];
  }

  get foamTexture() {
    return this.foam[0];
  }

  flood(renderer) {
    this.floodPasses.forEach((pass) => renderer.compute(pass));
    this.flooded = true;
  }

  update(config) {
    const u = this.uniforms;
    u.breakHigh.value = Math.max(config.breakLow + 0.05, config.breakHigh);
    u.breakLow.value = config.breakLow;
    u.breakWeight.value = config.breakWeight;
    u.damping.value = config.fluxDamping;
    u.drag.value = config.bedDrag;
    u.foamAdvect.value = config.foamAdvect;
    u.foamBirth.value = config.foamBirth;
    u.foamDecay.value = config.foamDecay;
    u.foamNoise.value = config.foamNoise;
    u.foamNoiseScale.value = config.foamNoiseScale;
    u.pipeArea.value = config.pipeArea;
    u.shallowDepth.value = config.shallowDepth;
    u.steepWeight.value = config.steepWeight;
    u.swellAmplitude.value = config.swellAmplitude;
    u.swellDrive.value = config.swellDrive;
    u.swellGroupRate.value = config.swellGroupRate;
    u.swellPeriod.value = config.swellPeriod;
    u.swellSpread.value = config.swellSpread;
    u.wetDepth.value = config.wetDepth;
  }

  step(renderer, delta, config) {
    if (!this.flooded) this.flood(renderer);

    const pairs = Math.max(1, Math.round(config.substeps / 2));
    const scaled = Math.min(delta, 1 / 30) * config.timeScale;
    this.uniforms.dt.value = scaled / (pairs * 2);
    this.uniforms.phase.value += scaled;

    for (let i = 0; i < pairs; i += 1) {
      renderer.compute(this.pipelines[0]);
      renderer.compute(this.pipelines[1]);
    }
  }

  dispose() {
    [...this.heights, ...this.flux, ...this.foam].forEach((texture) =>
      texture.dispose()
    );
  }
}
