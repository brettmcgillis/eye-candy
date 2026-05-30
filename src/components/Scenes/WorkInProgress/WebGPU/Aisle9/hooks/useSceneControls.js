import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import AISLE9_CAMERA_SPLINES from '../../../../../../presets/spline/aisle9CameraSplines';
import { DEFAULT_PRESET, PRESETS } from '../presets/presets';

const C = { collapsed: true };
const CAMERA_MODE_PATH = 'Aisle 9.Camera.cameraMode';

const QUALITY_PRESET_OPTIONS = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

const CAMERA_MODE_OPTIONS = {
  Fixed: 'fixed',
  Orbit: 'orbit',
  'Spline Motion': 'spline',
};

const PRESENTATION_MODE_OPTIONS = {
  'Store Warp': 'storeWarp',
  'Source Background': 'backgroundField',
};

const CAMERA_MODE_KEYS = ['cameraMode'];

const CAMERA_SCALAR_KEYS = [
  'cameraFov',
  'cameraMobileFov',
  'cameraNear',
  'cameraFar',
  'cameraAutoRotate',
  'cameraMinDistance',
  'cameraMaxDistance',
  'cameraRotateSpeed',
  'cameraDampingFactor',
];

const CAMERA_KEYS = [...CAMERA_SCALAR_KEYS, 'cameraPosition', 'cameraTarget'];

const CAMERA_MOBILE_KEYS = ['cameraMobilePosition', 'cameraMobileTarget'];

const CAMERA_FIXED_KEYS = ['fixedCameraPosition', 'fixedCameraTarget'];

const CAMERA_FIXED_MOBILE_KEYS = [
  'fixedCameraMobilePosition',
  'fixedCameraMobileTarget',
];

const CAMERA_SPLINE_KEYS = [
  'cameraSplinePreset',
  'cameraSplinePosition',
  'cameraSplineScale',
  'cameraSplineDuration',
  'cameraSplineTension',
  'cameraSplineLookAt',
];

const BLACK_HOLE_KEYS = [
  'presentationMode',
  'blackHoleMass',
  'gravitationalLensing',
  'dopplerStrength',
  'stepSize',
];

const BLACK_HOLE_TRANSFORM_KEYS = [
  'blackHolePosition',
  'blackHoleRotation',
  'blackHoleScale',
];

const DISK_GEOMETRY_KEYS = ['diskInnerRadius', 'diskOuterRadius'];

const DISK_APPEARANCE_KEYS = [
  'diskBrightness',
  'diskOpacity',
  'diskOpacityFloor',
  'diskTemperature',
  'temperatureFalloff',
  'diskEdgeSoftnessInner',
  'diskEdgeSoftnessOuter',
  'diskInnerColor',
  'diskMidColor',
  'diskOuterColor',
  'diskTintStrength',
];

const TURBULENCE_KEYS = [
  'diskRotationSpeed',
  'turbulenceScale',
  'turbulenceStretch',
  'turbulenceSharpness',
  'turbulenceCycleTime',
  'turbulenceLacunarity',
  'turbulencePersistence',
];

const STARS_KEYS = [
  'starsEnabled',
  'starBackgroundColor',
  'starDensity',
  'starSize',
  'starBrightness',
];

const NEBULA_LAYER_1_KEYS = [
  'nebulaEnabled',
  'nebula1Scale',
  'nebula1Density',
  'nebula1Brightness',
  'nebula1Color',
];

const NEBULA_LAYER_2_KEYS = [
  'nebula2Scale',
  'nebula2Density',
  'nebula2Brightness',
  'nebula2Color',
];

const BLOOM_KEYS = [
  'bloomEnabled',
  'bloomStrength',
  'bloomRadius',
  'bloomThreshold',
  'bloomDownSampleRatio',
];

const STORE_KEYS = ['storeScale'];

const STORE_TRANSFORM_KEYS = ['storePosition', 'storeRotation'];

const EXPLICIT_KEYS = new Set([
  ...CAMERA_MODE_KEYS,
  ...CAMERA_KEYS,
  ...CAMERA_MOBILE_KEYS,
  ...CAMERA_FIXED_KEYS,
  ...CAMERA_FIXED_MOBILE_KEYS,
  ...CAMERA_SPLINE_KEYS,
  ...BLACK_HOLE_KEYS,
  ...BLACK_HOLE_TRANSFORM_KEYS,
  ...DISK_GEOMETRY_KEYS,
  ...DISK_APPEARANCE_KEYS,
  ...TURBULENCE_KEYS,
  ...STARS_KEYS,
  ...NEBULA_LAYER_1_KEYS,
  ...NEBULA_LAYER_2_KEYS,
  ...BLOOM_KEYS,
  ...STORE_KEYS,
  ...STORE_TRANSFORM_KEYS,
]);

const CONTROL_SCHEMA = {
  cameraMode: {
    label: 'Mode',
    options: CAMERA_MODE_OPTIONS,
  },
  cameraFov: { label: 'FOV', min: 20, max: 100, step: 1 },
  cameraMobileFov: { label: 'Mobile FOV', min: 20, max: 100, step: 1 },
  cameraNear: { label: 'Near', min: 0.01, max: 10, step: 0.01 },
  cameraFar: { label: 'Far', min: 50, max: 5000, step: 10 },
  cameraAutoRotate: { label: 'Auto Rotate' },
  cameraPosition: { label: 'Position', min: -50, max: 200, step: 0.1 },
  cameraTarget: { label: 'Target', min: -20, max: 20, step: 0.1 },
  cameraMobilePosition: {
    label: 'Mobile Position',
    min: -50,
    max: 200,
    step: 0.1,
  },
  cameraMobileTarget: {
    label: 'Mobile Target',
    min: -20,
    max: 20,
    step: 0.1,
  },
  cameraMinDistance: {
    label: 'Min Distance',
    min: 1,
    max: 50,
    step: 0.1,
  },
  cameraMaxDistance: {
    label: 'Max Distance',
    min: 5,
    max: 400,
    step: 0.5,
  },
  cameraRotateSpeed: {
    label: 'Rotate Speed',
    min: -5,
    max: 5,
    step: 0.05,
  },
  cameraDampingFactor: {
    label: 'Damping',
    min: 0,
    max: 0.2,
    step: 0.005,
  },
  fixedCameraPosition: {
    label: 'Position',
    min: -100,
    max: 100,
    step: 0.1,
  },
  fixedCameraTarget: {
    label: 'Target',
    min: -100,
    max: 100,
    step: 0.1,
  },
  fixedCameraMobilePosition: {
    label: 'Mobile Position',
    min: -100,
    max: 100,
    step: 0.1,
  },
  fixedCameraMobileTarget: {
    label: 'Mobile Target',
    min: -100,
    max: 100,
    step: 0.1,
  },
  cameraSplinePreset: {
    label: 'Path',
    options: Object.keys(AISLE9_CAMERA_SPLINES),
  },
  cameraSplinePosition: {
    label: 'Position',
    min: -100,
    max: 100,
    step: 0.1,
  },
  cameraSplineScale: {
    label: 'Scale',
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  cameraSplineDuration: {
    label: 'Loop Duration (s)',
    min: 5,
    max: 120,
    step: 1,
  },
  cameraSplineTension: {
    label: 'Curve Tension',
    min: 0,
    max: 1,
    step: 0.1,
  },
  cameraSplineLookAt: {
    label: 'Look At',
    min: -100,
    max: 100,
    step: 0.1,
  },
  presentationMode: {
    label: 'Presentation',
    options: PRESENTATION_MODE_OPTIONS,
  },
  blackHoleMass: { label: 'Mass', min: 0.1, max: 3, step: 0.1 },
  gravitationalLensing: {
    label: 'Grav. Lensing',
    min: 0.5,
    max: 3,
    step: 0.1,
  },
  dopplerStrength: {
    label: 'Doppler',
    min: 0,
    max: 2,
    step: 0.1,
  },
  stepSize: { label: 'Step Size', min: 0.05, max: 2, step: 0.05 },
  blackHolePosition: {
    label: 'Position',
    min: -100,
    max: 100,
    step: 0.1,
  },
  blackHoleRotation: {
    label: 'Rotation (deg)',
    min: -180,
    max: 180,
    step: 1,
  },
  blackHoleScale: {
    label: 'Scale',
    min: 0.1,
    max: 20,
    step: 0.1,
  },
  diskInnerRadius: { label: 'Inner Radius', min: 2, max: 5, step: 0.1 },
  diskOuterRadius: { label: 'Outer Radius', min: 6, max: 20, step: 0.5 },
  diskBrightness: { label: 'Brightness', min: 0.5, max: 8, step: 0.1 },
  diskOpacity: { label: 'Opacity', min: 0, max: 2, step: 0.01 },
  diskOpacityFloor: { label: 'Opacity Floor', min: 0, max: 1, step: 0.01 },
  diskTemperature: { label: 'Peak Temp', min: 1, max: 50, step: 1 },
  temperatureFalloff: {
    label: 'Temp Falloff',
    min: 0.25,
    max: 15,
    step: 0.01,
  },
  diskEdgeSoftnessInner: {
    label: 'Inner Softness',
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  diskEdgeSoftnessOuter: {
    label: 'Outer Softness',
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  diskInnerColor: { label: 'Inner Color' },
  diskMidColor: { label: 'Mid Color' },
  diskOuterColor: { label: 'Outer Color' },
  diskTintStrength: {
    label: 'Tint Strength',
    min: 0,
    max: 1,
    step: 0.01,
  },
  diskRotationSpeed: {
    label: 'Rotation Speed',
    min: -20,
    max: 20,
    step: 0.1,
  },
  turbulenceScale: { label: 'Scale', min: 0.1, max: 2, step: 0.01 },
  turbulenceStretch: {
    label: 'Stretch',
    min: 0.1,
    max: 10,
    step: 0.01,
  },
  turbulenceSharpness: {
    label: 'Sharpness',
    min: 0.1,
    max: 10,
    step: 0.1,
  },
  turbulenceCycleTime: {
    label: 'Cycle Time',
    min: 5,
    max: 30,
    step: 1,
  },
  turbulenceLacunarity: {
    label: 'Lacunarity',
    min: 1,
    max: 4,
    step: 0.1,
  },
  turbulencePersistence: {
    label: 'Persistence',
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  starsEnabled: { label: 'Enable Stars' },
  starBackgroundColor: { label: 'Backdrop' },
  starDensity: { label: 'Density', min: 0.001, max: 0.1, step: 0.001 },
  starSize: { label: 'Size', min: 0.5, max: 5, step: 0.1 },
  starBrightness: { label: 'Brightness', min: 0.1, max: 3, step: 0.1 },
  nebulaEnabled: { label: 'Enable Nebula' },
  nebula1Scale: { label: 'Scale', min: 0.5, max: 10, step: 0.5 },
  nebula1Density: { label: 'Density', min: -1, max: 1, step: 0.05 },
  nebula1Brightness: {
    label: 'Brightness',
    min: 0,
    max: 1,
    step: 0.01,
  },
  nebula1Color: { label: 'Color' },
  nebula2Scale: { label: 'Scale', min: 0.5, max: 20, step: 0.5 },
  nebula2Density: { label: 'Density', min: -1, max: 1, step: 0.05 },
  nebula2Brightness: {
    label: 'Brightness',
    min: 0,
    max: 1,
    step: 0.01,
  },
  nebula2Color: { label: 'Color' },
  bloomEnabled: { label: 'Enabled' },
  bloomStrength: { label: 'Strength', min: 0, max: 3, step: 0.01 },
  bloomRadius: { label: 'Radius', min: 0, max: 1, step: 0.01 },
  bloomThreshold: { label: 'Threshold', min: 0, max: 1, step: 0.01 },
  bloomDownSampleRatio: {
    label: 'Downsample',
    options: { '1x': 1, '2x': 2, '4x': 4 },
  },
  storeScale: {
    label: 'Store Scale',
    min: 50,
    max: 1000,
    step: 1,
  },
  storePosition: {
    label: 'Position',
    min: -100,
    max: 100,
    step: 0.1,
  },
  storeRotation: {
    label: 'Rotation (deg)',
    min: -180,
    max: 180,
    step: 1,
  },
};

function humanizeKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

function createControl(key, value) {
  if (key === 'qualityPreset') {
    return {
      label: 'Quality Preset',
      value,
      options: QUALITY_PRESET_OPTIONS,
    };
  }

  const schema = CONTROL_SCHEMA[key] || {};
  return {
    label: schema.label || humanizeKey(key),
    value,
    ...schema,
  };
}

function createFolderControls(keys, preset) {
  return Object.fromEntries(
    keys.map((key) => [key, createControl(key, preset[key])])
  );
}

function createLegacyControls(preset) {
  return Object.fromEntries(
    Object.entries(preset)
      .filter(([key]) => !EXPLICIT_KEYS.has(key))
      .map(([key, value]) => [key, createControl(key, value)])
  );
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const presetSnapshot = useMemo(
    () => PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET],
    [initialPreset]
  );

  const presetControls = useMemo(
    () => getPresetControls({ presetSnapshot }),
    [presetSnapshot]
  );

  const [controls, setControls] = useControls(
    'Aisle 9',
    () => ({
      Presets: presetsFolder,
      Camera: folder(
        {
          ...createFolderControls(CAMERA_MODE_KEYS, presetControls),
          ...createFolderControls(CAMERA_KEYS, presetControls),
          'Viewport Fit': folder(
            createFolderControls(CAMERA_MOBILE_KEYS, presetControls),
            C
          ),
          'Fixed Camera': folder(
            {
              ...createFolderControls(CAMERA_FIXED_KEYS, presetControls),
              'Viewport Fit': folder(
                createFolderControls(CAMERA_FIXED_MOBILE_KEYS, presetControls),
                C
              ),
            },
            {
              collapsed: true,
              render: (get) => get(CAMERA_MODE_PATH) === 'fixed',
            }
          ),
          'Spline Motion': folder(
            createFolderControls(CAMERA_SPLINE_KEYS, presetControls),
            {
              collapsed: true,
              render: (get) => get(CAMERA_MODE_PATH) === 'spline',
            }
          ),
        },
        C
      ),
      BlackHole: folder(
        {
          ...createFolderControls(BLACK_HOLE_KEYS, presetControls),
          Transform: folder(
            createFolderControls(BLACK_HOLE_TRANSFORM_KEYS, presetControls),
            C
          ),
        },
        C
      ),
      Disk: folder(
        {
          Geometry: folder(
            createFolderControls(DISK_GEOMETRY_KEYS, presetControls),
            C
          ),
          Appearance: folder(
            createFolderControls(DISK_APPEARANCE_KEYS, presetControls),
            C
          ),
          Turbulence: folder(
            createFolderControls(TURBULENCE_KEYS, presetControls),
            C
          ),
        },
        C
      ),
      Stars: folder(createFolderControls(STARS_KEYS, presetControls), C),
      Nebula: folder(
        {
          Layer1: folder(
            createFolderControls(NEBULA_LAYER_1_KEYS, presetControls),
            C
          ),
          Layer2: folder(
            createFolderControls(NEBULA_LAYER_2_KEYS, presetControls),
            C
          ),
        },
        C
      ),
      Store: folder(
        {
          ...createFolderControls(STORE_KEYS, presetControls),
          Transform: folder(
            createFolderControls(STORE_TRANSFORM_KEYS, presetControls),
            C
          ),
        },
        C
      ),
      Bloom: folder(createFolderControls(BLOOM_KEYS, presetControls), C),
      Legacy: folder(createLegacyControls(presetControls), C),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  return controls;
}
