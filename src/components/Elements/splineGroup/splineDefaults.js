import * as THREE from 'three';

export const DEFAULT_SPLINE_CONFIG = {
  name: '',
  visible: true,
  type: 'Smoke',
  smokeType: 'Particle',
  fireType: 'Classic',
  tension: 1,
  closed: true,
  showSpline: true,
  showHelpers: true,
  arcSegments: 200,
  showSmokeVolume: false,
  showFireVolume: false,
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
};

export function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

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
    const { points: _pts, ...splineData } = spline;

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

export function filterParsedPresetByType(parsedPreset, type) {
  return parsedPreset.splines.reduce(
    (acc, points, index) => {
      const config = parsedPreset.splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;

      if ((config.type ?? DEFAULT_SPLINE_CONFIG.type) !== type) {
        return acc;
      }

      acc.splines.push(points);
      acc.splineConfigs.push(config);
      return acc;
    },
    { splines: [], splineConfigs: [] }
  );
}

export function serializeSplines(splines, splineConfigs) {
  return splines
    .map((pts, idx) => {
      const cfg = splineConfigs[idx] ?? DEFAULT_SPLINE_CONFIG;
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
