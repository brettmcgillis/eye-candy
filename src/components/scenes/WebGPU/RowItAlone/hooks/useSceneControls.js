import { folder, useControls } from 'leva';

import {
  DEFAULT_WAVE_QUALITY,
  FIRST_WAVE_BORDERS,
  FIRST_WAVE_DATASET,
  SECOND_WAVE_BORDERS,
  SECOND_WAVE_DATASET,
  WAVE_QUALITY_PRESETS,
} from '../runtime/waves/waveConstants';

function buildSpectrumControls(prefix, dataset, borders) {
  return Object.fromEntries(
    Object.entries(dataset).map(([key, control]) => [
      `${prefix}${key}`,
      {
        label: key,
        max: borders[key].max,
        min: borders[key].min,
        value: control.value,
      },
    ])
  );
}

function readSpectrumValues(controls, prefix, dataset) {
  return Object.fromEntries(
    Object.keys(dataset).map((key) => [key, controls[`${prefix}${key}`]])
  );
}

export default function useSceneControls() {
  const controls = useControls('Row It Alone WebGPU', {
    Camera: folder(
      {
        camX: { label: 'X', value: 30, min: -200, max: 200, step: 0.1 },
        camY: { label: 'Y', value: 20, min: 1, max: 200, step: 0.1 },
        camZ: { label: 'Z', value: 30, min: -200, max: 200, step: 0.1 },
        targetX: {
          label: 'Target X',
          value: 0,
          min: -100,
          max: 100,
          step: 0.1,
        },
        targetY: { label: 'Target Y', value: 0, min: -50, max: 50, step: 0.1 },
        targetZ: {
          label: 'Target Z',
          value: 0,
          min: -100,
          max: 100,
          step: 0.1,
        },
        fov: { value: 50, min: 20, max: 90, step: 1 },
        minDistance: { value: 10, min: 1, max: 200, step: 1 },
        maxDistance: { value: 1200, min: 50, max: 10000, step: 10 },
      },
      { collapsed: true }
    ),
    Sky: folder(
      {
        elevation: { value: 2, min: 0, max: 90, step: 0.1 },
        azimuth: { value: 180, min: -180, max: 180, step: 0.1 },
        exposure: { value: 1, min: 0.05, max: 2.5, step: 0.01 },
        rayleigh: { value: 3, min: 0, max: 4, step: 0.001 },
        turbidity: { value: 10, min: 1, max: 20, step: 0.1 },
        mieCoefficient: { value: 0.005, min: 0, max: 0.02, step: 0.0001 },
        mieDirectionalG: { value: 0.7, min: 0, max: 1, step: 0.001 },
      },
      { collapsed: true }
    ),
    'First Wave Spectrum': folder(
      buildSpectrumControls('first_', FIRST_WAVE_DATASET, FIRST_WAVE_BORDERS),
      { collapsed: true }
    ),
    'Second Wave Spectrum': folder(
      buildSpectrumControls(
        'second_',
        SECOND_WAVE_DATASET,
        SECOND_WAVE_BORDERS
      ),
      { collapsed: true }
    ),
    Foam: folder(
      {
        foamStrength: { value: 0.8, min: 0, max: 5, step: 0.1 },
        foamThreshold: { value: 2.7, min: 0, max: 5, step: 0.1 },
      },
      { collapsed: true }
    ),
    Ocean: folder(
      {
        patchSize: { value: 160, min: 20, max: 1000, step: 1 },
        patchResolution: { value: 192, min: 16, max: 512, step: 1 },
        wireframe: false,
        lodScale: { value: 3.7, min: 0, max: 20, step: 0.1 },
      },
      { collapsed: false }
    ),
    Lighting: folder(
      {
        sunIntensity: { label: 'Sun', value: 2.6, min: 0, max: 10, step: 0.05 },
        sunColor: { label: 'Sun Color', value: '#fff2dd' },
        hemisphereIntensity: {
          label: 'Hemisphere',
          value: 0.9,
          min: 0,
          max: 5,
          step: 0.05,
        },
        hemisphereSkyColor: { label: 'Sky Color', value: '#bcd9ff' },
        hemisphereGroundColor: { label: 'Ground Color', value: '#2f4a5c' },
      },
      { collapsed: true }
    ),
    Boat: folder(
      {
        boatScale: { label: 'Scale', value: 1, min: 0.1, max: 8, step: 0.05 },
        boatPositionX: { label: 'X', value: 0, min: -60, max: 60, step: 0.1 },
        boatPositionY: { label: 'Y', value: 0, min: -5, max: 5, step: 0.01 },
        boatPositionZ: { label: 'Z', value: 0, min: -60, max: 60, step: 0.1 },
        boatRotationY: {
          label: 'Rot Y',
          value: -20,
          min: -180,
          max: 180,
          step: 1,
        },
        boatDraft: { label: 'Draft', value: 0.03, min: -2, max: 2, step: 0.01 },
        boatMass: { label: 'Mass', value: 1.4, min: 0.05, max: 50, step: 0.01 },
        boatBuoyancy: {
          label: 'Buoyancy',
          value: 5.8,
          min: 0,
          max: 80,
          step: 0.1,
        },
        boatBuoyancyDamping: {
          label: 'Buoy Damp',
          value: 3,
          min: 0,
          max: 20,
          step: 0.05,
        },
        boatLinearDamping: {
          label: 'Linear Damp',
          value: 3.4,
          min: 0,
          max: 20,
          step: 0.05,
        },
        boatAngularDamping: {
          label: 'Angular Damp',
          value: 8.5,
          min: 0,
          max: 20,
          step: 0.05,
        },
        boatProbeLift: {
          label: 'Probe Lift',
          value: 0.02,
          min: -1,
          max: 2,
          step: 0.01,
        },
        boatProbeForward: {
          label: 'Probe Forward',
          value: 0.72,
          min: 0.05,
          max: 5,
          step: 0.01,
        },
        boatProbeSide: {
          label: 'Probe Side',
          value: 0.34,
          min: 0.05,
          max: 5,
          step: 0.01,
        },
        hideInteriorWater: { label: 'Hide Interior Water', value: true },
        interiorInset: {
          label: 'Interior Inset',
          value: 0.92,
          min: 0.3,
          max: 1.2,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
    Oars: folder(
      {
        jointMinAngle: {
          label: 'Min Angle',
          value: -58,
          min: -180,
          max: 0,
          step: 1,
        },
        jointMaxAngle: {
          label: 'Max Angle',
          value: 36,
          min: 0,
          max: 180,
          step: 1,
        },
        oarLinearDamping: {
          label: 'Linear Damp',
          value: 1.8,
          min: 0,
          max: 8,
          step: 0.05,
        },
        oarAngularDamping: {
          label: 'Angular Damp',
          value: 5.5,
          min: 0,
          max: 20,
          step: 0.05,
        },
        oarBuoyancy: {
          label: 'Buoyancy',
          value: 12,
          min: 0,
          max: 40,
          step: 0.1,
        },
        oarBuoyancyDamping: {
          label: 'Buoy Damp',
          value: 2.2,
          min: 0,
          max: 10,
          step: 0.05,
        },
        oarProbeLift: {
          label: 'Probe Lift',
          value: 0.1,
          min: -1,
          max: 2,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
    Physics: folder(
      {
        gravityY: {
          label: 'Gravity Y',
          value: -9.81,
          min: -20,
          max: 0,
          step: 0.01,
        },
        oarMass: {
          label: 'Oar Mass',
          value: 0.25,
          min: 0.05,
          max: 10,
          step: 0.01,
        },
        timeStep: {
          label: 'Time Step',
          value: 1 / 90,
          min: 1 / 240,
          max: 1 / 30,
          step: 0.0005,
        },
        buoyancyModeCount: {
          label: 'Wave Modes',
          value: 192,
          min: 32,
          max: 1024,
          step: 32,
        },
      },
      { collapsed: true }
    ),
    Performance: folder(
      {
        quality: {
          options: Object.keys(WAVE_QUALITY_PRESETS),
          value: DEFAULT_WAVE_QUALITY,
        },
        pauseWater: { label: 'Pause water', value: false },
        waveUpdateHz: { value: 30, min: 5, max: 60, step: 1 },
      },
      { collapsed: true }
    ),
  });

  return {
    lighting: {
      groundColor: controls.hemisphereGroundColor,
      hemisphere: controls.hemisphereIntensity,
      skyColor: controls.hemisphereSkyColor,
      sun: controls.sunIntensity,
      sunColor: controls.sunColor,
    },
    boat: {
      angularDamping: controls.boatAngularDamping,
      buoyancy: controls.boatBuoyancy,
      buoyancyDamping: controls.boatBuoyancyDamping,
      draft: controls.boatDraft,
      hideInteriorWater: controls.hideInteriorWater,
      interiorInset: controls.interiorInset,
      linearDamping: controls.boatLinearDamping,
      mass: controls.boatMass,
      position: [
        controls.boatPositionX,
        controls.boatPositionY,
        controls.boatPositionZ,
      ],
      probeForward: controls.boatProbeForward,
      probeLift: controls.boatProbeLift,
      probeSide: controls.boatProbeSide,
      rotationY: controls.boatRotationY,
      scale: controls.boatScale,
    },
    oars: {
      angularDamping: controls.oarAngularDamping,
      buoyancy: controls.oarBuoyancy,
      buoyancyDamping: controls.oarBuoyancyDamping,
      jointMaxAngle: controls.jointMaxAngle,
      jointMinAngle: controls.jointMinAngle,
      linearDamping: controls.oarLinearDamping,
      probeLift: controls.oarProbeLift,
    },
    physics: {
      gravity: [0, controls.gravityY, 0],
      oarMass: controls.oarMass,
      timeStep: controls.timeStep,
    },
    buoyancy: {
      modeCount: controls.buoyancyModeCount,
    },
    camera: {
      fov: controls.fov,
      maxDistance: controls.maxDistance,
      minDistance: controls.minDistance,
      position: [controls.camX, controls.camY, controls.camZ],
      target: [controls.targetX, controls.targetY, controls.targetZ],
    },
    ocean: {
      lodScale: controls.lodScale,
      patchResolution: controls.patchResolution,
      patchSize: controls.patchSize,
      wireframe: controls.wireframe,
    },
    foam: {
      foamStrength: controls.foamStrength,
      foamThreshold: controls.foamThreshold,
    },
    sky: {
      azimuth: controls.azimuth,
      elevation: controls.elevation,
      exposure: controls.exposure,
      mieCoefficient: controls.mieCoefficient,
      mieDirectionalG: controls.mieDirectionalG,
      rayleigh: controls.rayleigh,
      turbidity: controls.turbidity,
      up: [0, 1, 0],
    },
    performance: {
      pauseWater: controls.pauseWater,
      quality: controls.quality,
      waveUpdateHz: controls.waveUpdateHz,
    },
    waveSettings: {
      ...readSpectrumValues(controls, 'first_', FIRST_WAVE_DATASET),
      ...readSpectrumValues(controls, 'second_', SECOND_WAVE_DATASET),
    },
  };
}
