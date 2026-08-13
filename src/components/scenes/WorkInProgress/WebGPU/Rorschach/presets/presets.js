// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets"). Only the
// keys a preset actually wants to override need to be listed (SceneTemplate's
// Default preset is the same partial-object style).
import {
  DEFAULT_BUNDLE_COUNT,
  DEFAULT_COEFF_RANGE,
  DEFAULT_FREQ,
  DEFAULT_START_SPREAD,
  DEFAULT_STEPS,
  DEFAULT_STRANDS_PER_BUNDLE,
} from '../utils/testGenerator';

export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  // orbitAutoRotate here is a live regression check (docs/scene-conventions.md
  // §10): utils/camera.js declares no auto-rotate, so seeing it ON immediately
  // on load (no "reset" click needed) means the preset is correctly seeding
  // the generated camera schema on first mount.
  Default: {
    cameraMode: 'orbit',
    orbitAutoRotate: false,
    orbitAutoRotateSpeed: 3,
    seed: 260708,
    bundleCount: DEFAULT_BUNDLE_COUNT,
    strandsPerBundle: DEFAULT_STRANDS_PER_BUNDLE,
    steps: DEFAULT_STEPS,
    startSpread: DEFAULT_START_SPREAD,
    coeffRange: DEFAULT_COEFF_RANGE,
    freq: DEFAULT_FREQ,
    growthDuration: 4,
    evolutionSpeed: 0.4,
    monochrome: true,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
