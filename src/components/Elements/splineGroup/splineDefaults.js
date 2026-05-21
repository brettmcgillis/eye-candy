import * as THREE from 'three';

const DEFAULT_SPLINE_POS = [0, 0, 0];
const DEFAULT_SPLINE_ROT = [0, 0, 0];
const DEFAULT_SPLINE_SCALE = [1, 1, 1];

const _groupPosition = new THREE.Vector3();
const _groupQuaternion = new THREE.Quaternion();
const _groupScale = new THREE.Vector3();
const _pointQuaternion = new THREE.Quaternion();
const _worldQuaternion = new THREE.Quaternion();
const _worldEuler = new THREE.Euler();
const _worldPosition = new THREE.Vector3();
const _localPosition = new THREE.Vector3();
const _transformMatrix = new THREE.Matrix4();
const _inverseTransformMatrix = new THREE.Matrix4();

export const DEFAULT_SPLINE_INSTANCE_TRANSFORM = {
  pos: [...DEFAULT_SPLINE_POS],
  rot: [...DEFAULT_SPLINE_ROT],
  scale: [...DEFAULT_SPLINE_SCALE],
};

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

function clonePoint(point) {
  return {
    position: point.position.clone(),
    rotation: point.rotation
      ? point.rotation.clone()
      : new THREE.Euler(0, 0, 0),
    scale: point.scale ? point.scale.clone() : new THREE.Vector3(1, 1, 1),
  };
}

export function cloneSplinePoints(points = []) {
  return points.map(clonePoint);
}

export function cloneSplineInstanceTransform(source = {}) {
  return {
    pos: cloneTuple(source.pos, DEFAULT_SPLINE_POS),
    rot: cloneTuple(source.rot, DEFAULT_SPLINE_ROT),
    scale: cloneTuple(source.scale, DEFAULT_SPLINE_SCALE),
  };
}

export function cloneSplineInstance(instance = {}) {
  return {
    ...instance,
    ...cloneSplineInstanceTransform(instance),
    points: cloneSplinePoints(instance.points ?? []),
  };
}

function hasExplicitSplineTransform(spline = {}) {
  return (
    Array.isArray(spline.pos) ||
    Array.isArray(spline.rot) ||
    Array.isArray(spline.scale)
  );
}

function composeSplineTransformMatrix(transform, out) {
  _groupPosition.fromArray(transform.pos);
  _groupQuaternion.setFromEuler(
    new THREE.Euler(transform.rot[0], transform.rot[1], transform.rot[2])
  );
  _groupScale.fromArray(transform.scale);
  out.compose(_groupPosition, _groupQuaternion, _groupScale);
  return out;
}

function normalizeLegacySpline(spline) {
  const points = cloneSplinePoints(spline.points ?? []);
  const origin = points[0]?.position.clone() ?? new THREE.Vector3(0, 0, 0);

  points.forEach((point) => {
    point.position.sub(origin);
  });

  return {
    ...spline,
    pos: origin.toArray(),
    rot: [...DEFAULT_SPLINE_ROT],
    scale: [...DEFAULT_SPLINE_SCALE],
    points,
  };
}

export function normalizeSplinePreset(spline = {}) {
  if (!hasExplicitSplineTransform(spline)) {
    return normalizeLegacySpline(spline);
  }

  return {
    ...spline,
    ...cloneSplineInstanceTransform(spline),
    points: cloneSplinePoints(spline.points ?? []),
  };
}

export function getSplineWorldPoints(spline = {}) {
  const normalizedSpline = normalizeSplinePreset(spline);
  const transform = cloneSplineInstanceTransform(normalizedSpline);

  composeSplineTransformMatrix(transform, _transformMatrix);

  return normalizedSpline.points.map((point) => {
    _worldPosition.copy(point.position).applyMatrix4(_transformMatrix);
    _pointQuaternion.setFromEuler(
      point.rotation ? point.rotation.clone() : new THREE.Euler(0, 0, 0)
    );
    _groupQuaternion.setFromEuler(
      new THREE.Euler(transform.rot[0], transform.rot[1], transform.rot[2])
    );
    _worldQuaternion.copy(_groupQuaternion).multiply(_pointQuaternion);
    _worldEuler.setFromQuaternion(_worldQuaternion);

    return {
      position: _worldPosition.clone(),
      rotation: _worldEuler.clone(),
      scale: new THREE.Vector3(
        (point.scale?.x ?? 1) * transform.scale[0],
        (point.scale?.y ?? 1) * transform.scale[1],
        (point.scale?.z ?? 1) * transform.scale[2]
      ),
    };
  });
}

export function getSplineWorldOrigin(spline = {}) {
  return getSplineWorldPoints(spline)[0]?.position ?? new THREE.Vector3();
}

export function worldPointsToSplineInstance(points = [], base = {}) {
  if (!points.length) {
    return {
      ...base,
      ...cloneSplineInstanceTransform(base),
      points: [],
    };
  }

  const transform = cloneSplineInstanceTransform(base);
  composeSplineTransformMatrix(transform, _transformMatrix);
  _inverseTransformMatrix.copy(_transformMatrix).invert();

  const localPoints = points.map((point) => {
    _localPosition.copy(point.position).applyMatrix4(_inverseTransformMatrix);

    return {
      position: _localPosition.clone(),
      rotation: point.rotation
        ? point.rotation.clone()
        : new THREE.Euler(0, 0, 0),
      scale: point.scale ? point.scale.clone() : new THREE.Vector3(1, 1, 1),
    };
  });

  return {
    ...base,
    ...transform,
    points: localPoints,
  };
}

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

  const splineInstances = sourceSplines.map(normalizeSplinePreset);

  const splines = splineInstances.map((spline) =>
    cloneSplinePoints(spline.points)
  );

  const splineConfigs = splineInstances.map((spline) => {
    const {
      points: _pts,
      pos: _pos,
      rot: _rot,
      scale: _scale,
      ...splineData
    } = spline;

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

  return { splineInstances, splines, splineConfigs };
}

export function filterParsedPresetByType(parsedPreset, type) {
  return parsedPreset.splineInstances.reduce(
    (acc, spline, index) => {
      const config = parsedPreset.splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;

      if ((config.type ?? DEFAULT_SPLINE_CONFIG.type) !== type) {
        return acc;
      }

      acc.splineInstances.push(cloneSplineInstance(spline));
      acc.splines.push(cloneSplinePoints(spline.points));
      acc.splineConfigs.push(config);
      return acc;
    },
    { splineInstances: [], splines: [], splineConfigs: [] }
  );
}

export function serializeSplines(splines, splineConfigs) {
  return splines
    .map((splineOrPoints, idx) => {
      const cfg = splineConfigs[idx] ?? DEFAULT_SPLINE_CONFIG;
      const {
        showSpline: _ss,
        showHelpers: _sh,
        showSmokeVolume: _ssv,
        showFireVolume: _sfv,
        ...presetCfg
      } = cfg;

      const spline = Array.isArray(splineOrPoints)
        ? {
            ...DEFAULT_SPLINE_INSTANCE_TRANSFORM,
            points: cloneSplinePoints(splineOrPoints),
          }
        : cloneSplineInstance(splineOrPoints);

      const pointStrs = spline.points.map((pt) => {
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

      const posEntries = spline.pos.map((value) => value.toFixed(3)).join(', ');
      const rotEntries = spline.rot.map((value) => value.toFixed(3)).join(', ');
      const scaleEntries = spline.scale
        .map((value) => value.toFixed(3))
        .join(', ');

      const cfgBlock = cfgEntries ? `${cfgEntries},\n` : '';

      return `  {\n${cfgBlock}    pos: [${posEntries}],\n    rot: [${rotEntries}],\n    scale: [${scaleEntries}],\n    points: [\n${pointStrs.join(',\n')}\n    ]\n  }`;
    })
    .join(',\n');
}
