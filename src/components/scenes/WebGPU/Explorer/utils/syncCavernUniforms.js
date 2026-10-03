/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import lantern from './lantern';
import { stepTrail, writeTrail } from './steamTrail';

// Everything the cavern pass reads from the controls, in one place so the
// live scene and the headless stills renderer drive it identically.
export default function syncCavernUniforms(
  u,
  c,
  { cameraPosition, delta, fov, height, light, trail, width }
) {
  const scale = c.worldScale;
  const lit = lantern(c);

  u.resolution.value.set(width, height);
  u.tanHalfFov.value = Math.tan(THREE.MathUtils.degToRad(fov) / 2);

  u.folds.value = c.folds;
  u.scaleBase.value = c.scaleBase;
  u.scaleGain.value = c.scaleGain;
  u.twist.value = c.twist;
  u.periodY.value = c.periodY;
  u.periodXZ.value = c.periodXZ;
  u.confine.value = c.confine ? 1 : 0;
  u.worldScale.value = scale;
  u.pivot.value.set(c.pivotX, c.pivotY, c.pivotZ);

  u.maxSteps.value = c.maxSteps;
  u.maxStepsF.value = c.maxSteps;
  u.shadowSteps.value = c.shadowSteps;
  u.stepSafety.value = c.stepSafety;
  u.escapeDistance.value = cameraPosition.distanceTo(light) + lit.range;
  // Not scaled: the hit test is `d < epsilon * t` with both in world units,
  // so epsilon is a ratio, not a length. Scaling it made the test 20x
  // looser than the reference's and the surfaces blobby.
  u.epsilon.value = c.surfaceEpsilon;
  u.normalEpsilon.value = c.normalEpsilon * scale;
  u.shadowBias.value = c.shadowBias * scale;
  u.aoStep.value = c.aoStep * scale;

  u.lightPos.value.copy(light);
  u.lightColor.value.setStyle(c.lightColor, THREE.LinearSRGBColorSpace);
  u.lightIntensity.value = c.lightIntensity;
  u.lightFacing.value = c.lightFacing;
  u.glowRate.value = lit.glowRate;
  u.shadowDepth.value = c.shadowDepth;
  u.shadowHardness.value = c.shadowHardness;

  u.paletteRate.value = lit.paletteRate;
  u.paletteSpan.value = c.paletteSpan;
  u.paletteBias.value = c.paletteBias;
  u.paletteAmp.value = c.paletteAmp;
  u.paletteFreq.value = c.paletteFreq;
  u.palettePhase.value.set(0, 1 / 3, 2 / 3);
  u.palettePhase.value
    .multiplyScalar(c.paletteSpread)
    .addScalar(c.palettePhase);

  u.sphereCore.value.setStyle(c.sphereCore, THREE.LinearSRGBColorSpace);
  u.sphereEdge.value.setStyle(c.sphereEdge, THREE.LinearSRGBColorSpace);
  u.sphereGlow.value = c.sphereBrightness;

  const s = u.steam;
  const sphereRadius = c.sphereRadius * scale;
  const puffs = {
    fade: c.steamFade,
    growth: c.steamGrowth * scale,
    lifespan: c.steamLifespan,
    rise: c.steamRise * scale,
    startRadius: sphereRadius * c.steamStartSize,
  };
  stepTrail(trail, light, delta * c.timeScale, puffs);
  writeTrail(trail, light, s.arrays, puffs);

  s.steamTime.value = trail.clock;
  s.steamEnabled.value = c.steamEnabled ? 1 : 0;
  s.steamSteps.value = c.steamSteps;
  s.sphereRadius.value = sphereRadius;
  s.coronaDensity.value = c.coronaDensity;
  s.coronaThickness.value = c.coronaThickness * scale;
  s.trailDensity.value = c.trailDensity;
  s.riseSpeed.value = c.steamRise * scale;
  // Extinction and scatter are per unit length, so they shrink as the
  // caverns grow — the same steam stays the same steam at any scale.
  s.steamScatter.value = c.steamScatter / scale;
  s.steamAbsorb.value = c.steamAbsorb / scale;
  s.noiseScale.value = c.steamNoiseScale / scale;
  s.boil.value = c.steamBoil;
  s.wisp.value = c.steamWisp;
  s.cameraClear.value = c.cameraClear * scale;
  // Scattering per unit length, like the steam's.
  s.haloStrength.value = c.haloStrength / scale;

  u.albedo.value.setStyle(c.albedo, THREE.LinearSRGBColorSpace);
  u.ambientColor.value.setStyle(c.ambientColor, THREE.LinearSRGBColorSpace);
  u.ambientStrength.value = c.ambientStrength;
  u.aoStrength.value = c.aoStrength;
  u.aoFloor.value = c.aoFloor;
  u.creviceDarkening.value = c.creviceDarkening;
  u.fogColor.value.setStyle(c.fogColor, THREE.LinearSRGBColorSpace);
  u.fogDensity.value = lit.fogDensity;

  u.exposure.value = c.exposure;
  u.postGamma.value = c.postGamma;
  u.filmic.value = c.filmic;
  u.lightWrap.value = c.lightWrap;
  u.rockVariation.value = c.rockVariation;
  u.rockNoiseScale.value = c.rockNoiseScale;
  u.specular.value = c.specular;
  u.gloss.value = c.gloss;
  // Absorption is per unit length, so it shrinks as the caverns grow.
  u.waterAbsorb.value
    .set(c.waterAbsorbR, c.waterAbsorbG, c.waterAbsorbB)
    .divideScalar(scale);
  u.saturation.value = c.saturation;
  u.vignette.value = c.vignette;
}
