import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical default config — superset of all smoke + fire spline params.
// SmokeTest uses only the smoke keys; FireTest uses only the fire keys;
// HotBox uses all of them.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SPLINE_CONFIG = {
  name: '',
  visible: true,
  type: 'Smoke', // 'Smoke' | 'Fire'
  smokeType: 'Particle', // 'Particle' | 'Volumetric'
  fireType: 'Classic', // 'Classic' | 'RayMarch' | 'Fireball'
  tension: 1,
  closed: true,
  showSpline: true,
  showHelpers: true,
  arcSegments: 200,
  showSmokeVolume: false,
  showFireVolume: false,
  // ── Particle Smoke ────────────────────────────────────────────────────────
  // All world-space values at scene scale (1 unit ≈ 1 metre).
  particleCount: 15000,
  particleSize: 0.4,
  particleColor: '#7c7989',
  opacity: 0.045,
  growth: 2.0,
  fadeExponent: 1.2,
  buoyancy: 0.2,
  rotSpeed: 0.3,
  blendMode: 'Normal',
  springK: 5,
  flowSpeed: 0.04,
  damping: 0.12,
  turbulence: 1.2,
  turbulenceSpeed: 0.3,
  spawnSpread: 1.2,
  maxDrift: 6,
  fadeRate: 8,
  // ── Volumetric Smoke ──────────────────────────────────────────────────────
  // All world-space values at scene scale (1 unit ≈ 1 metre).
  volParticleCount: 12000,
  volSize: 0.6,
  volColor: '#9090a0',
  volOpacity: 0.06,
  volBlendMode: 'Normal',
  volSpread: 1.2,
  volSpringK: 2.5,
  volDamping: 0.1,
  volTurbulence: 1.8,
  volTurbulenceSpeed: 0.25,
  volMaxDrift: 9,
  volGrowth: 1.5,
  volFadeExp: 1.2,
  volBuoyancy: 0,
  // ── Classic (VolumetricFire) ───────────────────────────────────────────────
  fireWidth: 0.8,
  fireHeight: 2.0,
  fireDepth: 0.8,
  fireSliceSpacing: 0.04,
  fireMagnitude: 1.3,
  fireLacunarity: 2.0,
  fireGain: 0.5,
  fireTintColor: '#ffffff',
  fireSaturation: 1.0,
  fireBrightness: 1.5,
  fireAnimated: true,
  fireAnimSpeed: 0.5,
  // ── RayMarch (CS184VolumetricFire) ────────────────────────────────────────
  cs184Magnitude: 1.3,
  cs184Lacunarity: 2.0,
  cs184Gain: 0.5,
  cs184Speed: 0.8,
  cs184Density: 1.2,
  cs184Brightness: 1.8,
  cs184Saturation: 1.0,
  cs184TintColor: '#ffffff',
  cs184CoreColor: '#ffffcc',
  cs184BorderColor: '#ff6600',
  cs184SmokeColor: '#330000',
  cs184EmberDensity: 0.15,
  cs184EmberSize: 0.25,
  cs184EmberColor: '#ff4400',
  cs184Steps: 64,
  cs184StepSize: 1.0,
  cs184Animated: true,
  cs184AnimSpeed: 0.5,
  // ── Fireball (FireballVolume) ─────────────────────────────────────────────
  fireballRadius: 0.8,
  fireballRotSpeed: 0.1,
  fireballNoiseScale: 0.5,
  fireballCoreColor: '#ccffff',
  fireballCoreIntensity: 7.0,
  fireballEdgeColor: '#7a877f',
  fireballEdgeIntensity: 1.5,
  fireballDensity: 1.0,
  fireballSteps: 64,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers shared across all toolbox control hooks
// ─────────────────────────────────────────────────────────────────────────────

export function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

/**
 * Parse a preset object into runtime spline points + configs.
 * Handles both legacy formats (type = 'Particle'|'Volumetric' on the spline)
 * and the new unified format (type = 'Smoke'|'Fire', smokeType, fireType).
 */
export function parsePreset(preset) {
  let sourceSplines = [];
  if (Array.isArray(preset?.splines)) {
    sourceSplines = preset.splines;
  } else if (preset?.points) {
    sourceSplines = [preset];
  }

  const splines = sourceSplines.map((spline) =>
    spline.points.map((pt) => ({
      position: pt.position.clone(),
      rotation: pt.rotation ? pt.rotation.clone() : new THREE.Euler(0, 0, 0),
      scale: pt.scale ? pt.scale.clone() : new THREE.Vector3(1, 1, 1),
    }))
  );

  const splineConfigs = sourceSplines.map((spline) => {
    // eslint-disable-next-line no-unused-vars
    const { points: _pts, ...splineData } = spline;

    // Legacy SmokeTest presets store type as 'Particle'|'Volumetric'.
    // Migrate to the new split: type='Smoke', smokeType='Particle'|'Volumetric'.
    let migratedData = { ...splineData };
    if (splineData.type === 'Particle' || splineData.type === 'Volumetric') {
      migratedData = {
        ...splineData,
        smokeType: splineData.type,
        type: 'Smoke',
      };
    }

    return { ...DEFAULT_SPLINE_CONFIG, ...migratedData };
  });

  return { splines, splineConfigs };
}

/**
 * Serialize the current spline state back to a JS-literal string suitable
 * for writing into a preset file.
 */
export function serializeSplines(splines, splineConfigs) {
  return splines
    .map((pts, idx) => {
      const cfg = splineConfigs[idx] ?? DEFAULT_SPLINE_CONFIG;
      // Destructure out view-only fields that shouldn't live in presets
      const {
        showSpline: _ss,
        showHelpers: _sh,
        showSmokeVolume: _ssv,
        showFireVolume: _sfv,
        ...presetCfg
      } = cfg;

      const pointStrs = pts.map((pt) => {
        const p = pt.position;
        const r = pt.rotation ?? new THREE.Euler();
        const s = pt.scale ?? new THREE.Vector3(1, 1, 1);
        return (
          `    { position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}),` +
          ` rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}),` +
          ` scale: new THREE.Vector3(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}) }`
        );
      });

      // Build the config entries (skip points — they're serialized separately)
      const cfgEntries = Object.entries(presetCfg)
        .map(([k, v]) => {
          if (typeof v === 'string') return `    ${k}: '${v}'`;
          return `    ${k}: ${v}`;
        })
        .join(',\n');

      return `  {\n${cfgEntries},\n    points: [\n${pointStrs.join(',\n')}\n    ]\n  }`;
    })
    .join(',\n');
}
