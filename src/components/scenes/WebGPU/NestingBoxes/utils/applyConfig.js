/* eslint-disable no-param-reassign */
import { COLOR_MODES, PALETTE_SOURCES } from './colorNodes';

export function applyTreeConfig(t, c, drift) {
  t.levels.value = c.levels;
  t.seed.value = c.seed;
  t.rootRadius.value.set(c.rootRadiusX, c.rootRadiusY, c.rootRadiusZ);
  t.shrink.value = c.shrink + drift.shrink;
  t.shrinkJitter.value = c.shrinkJitter;
  t.placementFrequency.value = c.placementFrequency;
  t.placementPhase.value.set(
    c.placementPhaseX,
    c.placementPhaseY,
    c.placementPhaseZ
  );
  t.placementDrift.value.fromArray(drift.placement);
  t.sizeFrequency.value = c.sizeFrequency;
  t.sizePhase.value.set(c.sizePhaseX, c.sizePhaseY, c.sizePhaseZ);
  t.sizeDrift.value.fromArray(drift.size);
  t.driftBias.value = c.driftBias;
}

export function applyColorConfig(u, c, drift) {
  u.colorMode.value = COLOR_MODES[c.colorMode] ?? 0;
  u.seed.value = c.seed;
  u.baseColor.value.set(c.baseColor);
  u.tintFrequency.value = c.tintFrequency;
  u.tintPhase.value
    .set(c.tintPhaseR, c.tintPhaseG, c.tintPhaseB)
    .addScalar(drift.tint);
  u.tintBase.value = c.tintBase;
  u.tintAmplitude.value = c.tintAmplitude;
  u.paletteSource.value = PALETTE_SOURCES[c.paletteSource] ?? 0;
  u.paletteRepeat.value = c.paletteRepeat;
  u.paletteShift.value = c.paletteShift + drift.tint * 0.05;
  u.rootRadius.value.set(c.rootRadiusX, c.rootRadiusY, c.rootRadiusZ);
  u.sizeFloor.value = Math.max((c.shrink - c.shrinkJitter) ** c.levels, 1e-6);
}

export function applySurfaceConfig(u, c) {
  u.textureScale.value = c.textureScale;
  u.textureStrength.value = c.textureStrength;
  u.roughness.value = c.roughness;
  u.normalStrength.value = c.normalStrength;
  u.aoStrength.value = c.aoStrength;
  u.weathering.value = c.weathering;
  u.grimeColor.value.set(c.grimeColor);
  u.grimeScale.value = c.grimeScale;
  u.grimeStreaks.value = c.grimeStreaks;
}
