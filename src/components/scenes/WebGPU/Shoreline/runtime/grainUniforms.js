import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// One set, shared by the grain kernel and the grain material: the kernel
// resolves where a grain is and what the water is doing to it, the material
// turns that into a colour, and several of these knobs are read on both sides.
export function buildGrainUniforms() {
  return {
    absorption: uniform(0.55),
    aeratedColor: uniform(new THREE.Color('#4fc9c2')),
    aerationTint: uniform(1.1),
    churnLift: uniform(0.16),
    churnRate: uniform(5),
    deepColor: uniform(new THREE.Color('#06232e')),
    dt: uniform(1 / 60),
    flowGain: uniform(1),
    flowTip: uniform(0.18),
    foamBreakup: uniform(0.55),
    foamColor: uniform(new THREE.Color('#eefaf8')),
    foamLift: uniform(0.05),
    foamMemory: uniform(1.2),
    foamPickup: uniform(12),
    foamOldColor: uniform(new THREE.Color('#9fc9c8')),
    foamRoughness: uniform(0.92),
    foamSoftness: uniform(0.3),
    foamSwell: uniform(1.35),
    foamThreshold: uniform(0.12),
    grainFade: uniform(0.12),
    grainResponse: uniform(6),
    grainLife: uniform(5),
    grainSettle: uniform(14),
    grainSizeMax: uniform(1.5),
    grainSizeMin: uniform(0.6),
    grainVariance: uniform(0.18),
    phase: uniform(0),
    reefColor: uniform(new THREE.Color('#04120f')),
    reefDepth: uniform(2.2),
    reefStrength: uniform(0.7),
    rockDepth: uniform(0.28),
    rockDryColor: uniform(new THREE.Color('#14191c')),
    rockGrainSize: uniform(0.17),
    rockJag: uniform(0.35),
    rockMottle: uniform(0.4),
    rockRoughness: uniform(0.9),
    rockTip: uniform(0.9),
    rockWetColor: uniform(new THREE.Color('#05080a')),
    shallowColor: uniform(new THREE.Color('#17707d')),
    shoreDrying: uniform(0.35),
    tipLimit: uniform(1.2),
    waterGrainSize: uniform(0.075),
    waterRoughness: uniform(0.14),
    wetDepth: uniform(0.08),
  };
}

export function applyGrainUniforms(uniforms, config) {
  const u = uniforms;
  u.absorption.value = config.absorption;
  u.aeratedColor.value.set(config.aeratedColor);
  u.aerationTint.value = config.aerationTint;
  u.churnLift.value = config.churnLift;
  u.churnRate.value = config.churnRate;
  u.deepColor.value.set(config.deepColor);
  u.flowGain.value = config.flowGain;
  u.flowTip.value = config.flowTip;
  u.foamBreakup.value = config.foamBreakup;
  u.foamColor.value.set(config.foamColor);
  u.foamLift.value = config.foamLift;
  u.foamMemory.value = config.foamMemory;
  u.foamPickup.value = config.foamPickup;
  u.foamOldColor.value.set(config.foamOldColor);
  u.foamRoughness.value = config.foamRoughness;
  u.foamSoftness.value = config.foamSoftness;
  u.foamSwell.value = config.foamSwell;
  u.foamThreshold.value = config.foamThreshold;
  u.grainFade.value = config.grainFade;
  u.grainResponse.value = config.grainResponse;
  u.grainLife.value = config.grainLife;
  u.grainSettle.value = config.grainSettle;
  u.grainSizeMax.value = Math.max(config.grainSizeMin, config.grainSizeMax);
  u.grainSizeMin.value = config.grainSizeMin;
  u.grainVariance.value = config.grainVariance;
  u.reefColor.value.set(config.reefColor);
  u.reefDepth.value = config.reefDepth;
  u.reefStrength.value = config.reefStrength;
  u.rockDepth.value = config.rockDepth;
  u.rockDryColor.value.set(config.rockDryColor);
  u.rockGrainSize.value = config.rockGrainSize;
  u.rockJag.value = config.rockJag;
  u.rockMottle.value = config.rockMottle;
  u.rockRoughness.value = config.rockRoughness;
  u.rockTip.value = config.rockTip;
  u.rockWetColor.value.set(config.rockWetColor);
  u.shallowColor.value.set(config.shallowColor);
  u.shoreDrying.value = config.shoreDrying;
  u.tipLimit.value = config.tipLimit;
  u.waterGrainSize.value = config.waterGrainSize;
  u.waterRoughness.value = config.waterRoughness;
  u.wetDepth.value = config.wetDepth;
}
