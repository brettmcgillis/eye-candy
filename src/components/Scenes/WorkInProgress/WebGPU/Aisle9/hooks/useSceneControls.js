import { folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
  DEFAULT_PRESET,
  PRESETS,
  SETTING_INDOOR,
  SETTING_OUTDOOR,
  buildAisle9CameraDeclaration,
  getPresetControls,
} from '../presets/presets';

const SCENE_LABEL = 'Aisle 9';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const COLLAPSED = { collapsed: true };

const BLACK_HOLE_VARIANT_OPTIONS = {
  'Legacy Port': BLACK_HOLE_VARIANT_LEGACY_PORT,
  'WebGPU Black Hole': BLACK_HOLE_VARIANT_WEBGPU,
  Singularity: BLACK_HOLE_VARIANT_SINGULARITY,
};

function buildLegacyControls(initialSnapshot) {
  return {
    legacyUseProceduralDisk: {
      label: 'Procedural Disk',
      value: initialSnapshot.legacyUseProceduralDisk ?? true,
    },
    legacyBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: initialSnapshot.legacyBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    legacyDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: initialSnapshot.legacyDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    legacyLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.legacyLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },

    legacyGravityStrength: {
      label: 'Gravity',
      value: initialSnapshot.legacyGravityStrength,
      min: 0.2,
      max: 2.4,
      step: 0.01,
    },
    legacyStepCount: {
      label: 'Step Count',
      value: initialSnapshot.legacyStepCount,
      min: 48,
      max: 256,
      step: 1,
    },
    legacyDiskBrightness: {
      label: 'Disk Brightness',
      value: initialSnapshot.legacyDiskBrightness,
      min: 0,
      max: 4,
      step: 0.01,
    },
    legacyDiskTemperature: {
      label: 'Disk Temp (K)',
      value: initialSnapshot.legacyDiskTemperature,
      min: 1800,
      max: 16000,
      step: 10,
    },
    legacyDopplerStrength: {
      label: 'Doppler',
      value: initialSnapshot.legacyDopplerStrength,
      min: 0,
      max: 2,
      step: 0.01,
    },
    legacyAccretionMinRadius: {
      label: 'Disk Inner Radius',
      value: initialSnapshot.legacyAccretionMinRadius ?? 1.5,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyAccretionWidth: {
      label: 'Disk Width',
      value: initialSnapshot.legacyAccretionWidth ?? 5,
      min: 0.5,
      max: 8,
      step: 0.01,
    },
    legacyMaxRevolutions: {
      label: 'Max Revolutions',
      value: initialSnapshot.legacyMaxRevolutions ?? 2,
      min: 0.5,
      max: 4,
      step: 0.01,
    },
    legacyStarBrightness: {
      label: 'Star Brightness',
      value: initialSnapshot.legacyStarBrightness ?? 1,
      min: 0,
      max: 3,
      step: 0.01,
    },
    legacyGalaxyBrightness: {
      label: 'Galaxy Brightness',
      value: initialSnapshot.legacyGalaxyBrightness ?? 0.4,
      min: 0,
      max: 2,
      step: 0.01,
    },
  };
}

function buildWebGPUControls(initialSnapshot) {
  return {
    webgpuBlackHoleDiameter: {
      label: 'Core Diameter (m)',
      value: initialSnapshot.webgpuBlackHoleDiameter,
      min: 0.08,
      max: 0.8,
      step: 0.001,
    },
    webgpuDiskDiameter: {
      label: 'Disk Diameter (m)',
      value: initialSnapshot.webgpuDiskDiameter,
      min: 0.35,
      max: 2.4,
      step: 0.01,
    },
    webgpuLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.webgpuLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    webgpuMass: {
      label: 'Mass',
      value: initialSnapshot.webgpuMass,
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    webgpuDiskInnerRadius: {
      label: 'Inner Radius',
      value:
        initialSnapshot.webgpuDiskInnerRadius ??
        (initialSnapshot.webgpuDiskOuterRadius ?? 14.5) * (4.1 / 14.5),
      min: 2,
      max: 8,
      step: 0.01,
    },
    webgpuDiskOuterRadius: {
      label: 'Outer Radius',
      value: initialSnapshot.webgpuDiskOuterRadius ?? 14.5,
      min: 6,
      max: 20,
      step: 0.1,
    },
    webgpuDiskBrightness: {
      label: 'Disk Brightness',
      value: initialSnapshot.webgpuDiskBrightness,
      min: 0,
      max: 8,
      step: 0.01,
    },
    webgpuTemperature: {
      label: 'Peak Temp (kK)',
      value: initialSnapshot.webgpuTemperature,
      min: 1,
      max: 60,
      step: 0.01,
    },
    webgpuTemperatureFalloff: {
      label: 'Temp Falloff',
      value: initialSnapshot.webgpuTemperatureFalloff ?? 5.22,
      min: 0.25,
      max: 15,
      step: 0.01,
    },
    webgpuLensingStrength: {
      label: 'Lensing',
      value: initialSnapshot.webgpuLensingStrength,
      min: 0.2,
      max: 4,
      step: 0.01,
    },
    webgpuDopplerStrength: {
      label: 'Doppler',
      value: initialSnapshot.webgpuDopplerStrength ?? 1,
      min: 0,
      max: 2,
      step: 0.01,
    },
    webgpuRotationSpeed: {
      label: 'Rotation Speed',
      value: initialSnapshot.webgpuRotationSpeed ?? -8.7,
      min: -20,
      max: 20,
      step: 0.01,
    },
    webgpuStepCount: {
      label: 'Step Count',
      value: initialSnapshot.webgpuStepCount,
      min: 24,
      max: 192,
      step: 1,
    },
    webgpuStepSize: {
      label: 'Step Size',
      value: initialSnapshot.webgpuStepSize,
      min: 0.05,
      max: 2,
      step: 0.001,
    },
    webgpuTurbulenceScale: {
      label: 'Turbulence Scale',
      value: initialSnapshot.webgpuTurbulenceScale ?? 1.81,
      min: 0.1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulenceStretch: {
      label: 'Arc Stretch',
      value: initialSnapshot.webgpuTurbulenceStretch ?? 0.75,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceSharpness: {
      label: 'Sharpness',
      value: initialSnapshot.webgpuTurbulenceSharpness ?? 7.4,
      min: 0.1,
      max: 10,
      step: 0.01,
    },
    webgpuTurbulenceCycleTime: {
      label: 'Cycle Time',
      value: initialSnapshot.webgpuTurbulenceCycleTime ?? 5,
      min: 1,
      max: 30,
      step: 0.1,
    },
    webgpuTurbulenceLacunarity: {
      label: 'Lacunarity',
      value: initialSnapshot.webgpuTurbulenceLacunarity ?? 3,
      min: 1,
      max: 4,
      step: 0.01,
    },
    webgpuTurbulencePersistence: {
      label: 'Persistence',
      value: initialSnapshot.webgpuTurbulencePersistence ?? 0.8,
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessInner: {
      label: 'Inner Softness',
      value: initialSnapshot.webgpuDiskEdgeSoftnessInner ?? 0.18,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    webgpuDiskEdgeSoftnessOuter: {
      label: 'Outer Softness',
      value: initialSnapshot.webgpuDiskEdgeSoftnessOuter ?? 0.5,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
  };
}

function buildSingularityControls(initialSnapshot) {
  return {
    singularityLensDiameter: {
      label: 'Lens Diameter',
      value: initialSnapshot.singularityLensDiameter,
      min: 0.5,
      max: 3.5,
      step: 0.01,
    },
    singularityIterations: {
      label: 'Iterations',
      value: initialSnapshot.singularityIterations,
      min: 32,
      max: 256,
      step: 1,
    },
    singularityStepSize: {
      label: 'Step Size',
      value: initialSnapshot.singularityStepSize,
      min: 0.001,
      max: 0.05,
      step: 0.001,
    },
    singularityPower: {
      label: 'Power',
      value: initialSnapshot.singularityPower,
      min: 0,
      max: 1,
      step: 0.01,
    },
    singularityOriginRadius: {
      label: 'Origin Radius',
      value: initialSnapshot.singularityOriginRadius,
      min: 0.01,
      max: 0.5,
      step: 0.001,
    },
    singularityBandWidth: {
      label: 'Band Width',
      value: initialSnapshot.singularityBandWidth,
      min: 0.005,
      max: 0.3,
      step: 0.001,
    },
    singularityFieldScale: {
      label: 'Field Scale',
      value: initialSnapshot.singularityFieldScale ?? 3.8,
      min: 0.5,
      max: 12,
      step: 0.1,
    },
    singularityRampPos1: {
      label: 'Ramp Pos 1',
      value: initialSnapshot.singularityRampPos1 ?? 0.05,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos2: {
      label: 'Ramp Pos 2',
      value: initialSnapshot.singularityRampPos2 ?? 0.425,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampPos3: {
      label: 'Ramp Pos 3',
      value: initialSnapshot.singularityRampPos3 ?? 1,
      min: 0,
      max: 1,
      step: 0.001,
    },
    singularityRampColor1: {
      label: 'Ramp 1',
      value: initialSnapshot.singularityRampColor1,
    },
    singularityRampColor2: {
      label: 'Ramp 2',
      value: initialSnapshot.singularityRampColor2,
    },
    singularityRampColor3: {
      label: 'Ramp 3',
      value: initialSnapshot.singularityRampColor3,
    },
    singularityEmissionStrength: {
      label: 'Emission',
      value: initialSnapshot.singularityEmissionStrength,
      min: 0,
      max: 6,
      step: 0.01,
    },
  };
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
  const initialSnapshot = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];
  const cameraApiRef = useRef(null);
  const cameraControlOverrides = useMemo(() => {
    return {
      cameraAutoFit: {
        render: (get) => get(`${CAMERA_FOLDER_PATH}.cameraMode`) === 'orbit',
      },
    };
  }, []);
  const initialCamera = useMemo(() => {
    return buildAisle9CameraDeclaration(initialSnapshot);
  }, [initialSnapshot]);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: initialCamera,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
    controlOverrides: cameraControlOverrides,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, COLLAPSED),
    Scene: folder(
      {
        setting: {
          label: 'Setting',
          value: initialSnapshot.setting ?? SETTING_INDOOR,
          options: { Indoor: SETTING_INDOOR, Outdoor: SETTING_OUTDOOR },
        },
        Lighting: folder(
          {
            Ambient: folder(
              {
                ambientColor: {
                  label: 'Color',
                  value: initialSnapshot.ambientColor,
                },
                ambientIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.ambientIntensity,
                  min: 0,
                  max: 5,
                  step: 0.01,
                },
              },
              COLLAPSED
            ),
            Moon: folder(
              {
                moonColor: { label: 'Color', value: initialSnapshot.moonColor },
                moonIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.moonIntensity,
                  min: 0,
                  max: 2,
                  step: 0.01,
                },
              },
              COLLAPSED
            ),
            'Outdoor Lights': folder(
              {
                outdoorEmissiveColor: {
                  label: 'Emissive Color',
                  value: initialSnapshot.outdoorEmissiveColor,
                },
                outdoorEmissiveIntensity: {
                  label: 'Emissive',
                  value: initialSnapshot.outdoorEmissiveIntensity ?? 0,
                  min: 0,
                  max: 10,
                  step: 0.05,
                },
                outdoorLightColor: {
                  label: 'Light Color',
                  value: initialSnapshot.outdoorLightColor,
                },
                outdoorLightIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.outdoorLightIntensity ?? 0,
                  min: 0,
                  max: 10000,
                  step: 50,
                },
              },
              COLLAPSED
            ),
            'Indoor Lights': folder(
              {
                indoorEmissiveColor: {
                  label: 'Emissive Color',
                  value: initialSnapshot.indoorEmissiveColor,
                },
                indoorEmissiveIntensity: {
                  label: 'Emissive',
                  value: initialSnapshot.indoorEmissiveIntensity ?? 0,
                  min: 0,
                  max: 10,
                  step: 0.05,
                },
                indoorLightColor: {
                  label: 'Light Color',
                  value: initialSnapshot.indoorLightColor,
                },
                indoorLightIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.indoorLightIntensity ?? 0,
                  min: 0,
                  max: 10000,
                  step: 50,
                },
              },
              COLLAPSED
            ),
            'Store Fill': folder(
              {
                storeFillColor: {
                  label: 'Color',
                  value: initialSnapshot.storeFillColor,
                },
                storeFillIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.storeFillIntensity ?? 0,
                  min: 0,
                  max: 5000,
                  step: 10,
                },
              },
              COLLAPSED
            ),
            Sign: folder(
              {
                signEmissiveColor: {
                  label: 'Color',
                  value: initialSnapshot.signEmissiveColor,
                },
                signGlowIntensity: {
                  label: 'Intensity',
                  value: initialSnapshot.signGlowIntensity ?? 0,
                  min: 0,
                  max: 5,
                  step: 0.01,
                },
              },
              COLLAPSED
            ),
          },
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
    Blackhole: folder(
      {
        blackHoleEnabled: {
          label: 'Enabled',
          value: initialSnapshot.blackHoleEnabled ?? true,
        },
        blackHoleVariant: {
          label: 'Variation',
          value: initialSnapshot.blackHoleVariant,
          options: BLACK_HOLE_VARIANT_OPTIONS,
        },
        Legacy: folder(buildLegacyControls(initialSnapshot), COLLAPSED),
        WebGPU: folder(buildWebGPUControls(initialSnapshot), COLLAPSED),
        Singularity: folder(
          buildSingularityControls(initialSnapshot),
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
    'Orbiting bodies': folder(
      {
        orbitingBodiesEnabled: {
          label: 'Enabled',
          value: initialSnapshot.orbitingBodiesEnabled ?? true,
        },
        Orbit: folder(
          {
            bodyOrbitRadius: {
              label: 'Radius',
              value: initialSnapshot.bodyOrbitRadius,
              min: 0.35,
              max: 3.2,
              step: 0.01,
            },
            bodyOrbitHeight: {
              label: 'Height',
              value: initialSnapshot.bodyOrbitHeight,
              min: -1,
              max: 1,
              step: 0.01,
            },
            bodyOrbitSpeed: {
              label: 'Speed',
              value: initialSnapshot.bodyOrbitSpeed,
              min: -1.5,
              max: 1.5,
              step: 0.01,
            },
          },
          COLLAPSED
        ),
        'Body 1': folder(
          {
            body1Scale: {
              label: 'Scale',
              value: initialSnapshot.body1Scale ?? 1,
              min: 0,
              max: 4,
              step: 0.01,
            },
            body1Instances: {
              label: 'Instances',
              value: initialSnapshot.body1Instances ?? 1,
              min: 0,
              max: 12,
              step: 1,
            },
          },
          COLLAPSED
        ),
        'Body 2': folder(
          {
            body2Scale: {
              label: 'Scale',
              value: initialSnapshot.body2Scale ?? 1,
              min: 0,
              max: 4,
              step: 0.01,
            },
            body2Instances: {
              label: 'Instances',
              value: initialSnapshot.body2Instances ?? 1,
              min: 0,
              max: 12,
              step: 1,
            },
          },
          COLLAPSED
        ),
        'Body 3': folder(
          {
            body3Scale: {
              label: 'Scale',
              value: initialSnapshot.body3Scale ?? 1,
              min: 0,
              max: 4,
              step: 0.01,
            },
            body3Instances: {
              label: 'Instances',
              value: initialSnapshot.body3Instances ?? 1,
              min: 0,
              max: 12,
              step: 1,
            },
          },
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
    Sky: folder(
      {
        skyboxEnabled: {
          label: 'Enabled',
          value: initialSnapshot.skyboxEnabled ?? true,
        },
        skyboxMode: {
          label: 'Mode',
          value: initialSnapshot.skyboxMode ?? 'night',
          options: ['night', 'day'],
        },
        skyboxRotationEnabled: {
          label: 'Rotate',
          value: initialSnapshot.skyboxRotationEnabled ?? false,
        },
        skyboxRotationSpeed: {
          label: 'Rotation Speed',
          value: initialSnapshot.skyboxRotationSpeed ?? 2,
          min: -30,
          max: 30,
          step: 0.1,
        },
        'Day Sky': folder(
          {
            skyTurbidity: {
              label: 'Turbidity',
              value: initialSnapshot.skyTurbidity ?? 8,
              min: 0,
              max: 20,
              step: 0.1,
            },
            skyRayleigh: {
              label: 'Rayleigh',
              value: initialSnapshot.skyRayleigh ?? 3,
              min: 0,
              max: 4,
              step: 0.001,
            },
            skyMieCoefficient: {
              label: 'Mie Coefficient',
              value: initialSnapshot.skyMieCoefficient ?? 0.005,
              min: 0,
              max: 0.1,
              step: 0.001,
            },
            skyMieDirectionalG: {
              label: 'Mie Directional G',
              value: initialSnapshot.skyMieDirectionalG ?? 0.8,
              min: 0,
              max: 1,
              step: 0.001,
            },
            skyElevation: {
              label: 'Elevation',
              value: initialSnapshot.skyElevation ?? 8,
              min: 0,
              max: 90,
              step: 0.1,
            },
            skyAzimuth: {
              label: 'Azimuth',
              value: initialSnapshot.skyAzimuth ?? 180,
              min: -180,
              max: 180,
              step: 0.1,
            },
            skyShowSunDisc: {
              label: 'Sun Disc',
              value: initialSnapshot.skyShowSunDisc ?? true,
            },
            Clouds: folder(
              {
                skyCloudCoverage: {
                  label: 'Coverage',
                  value: initialSnapshot.skyCloudCoverage ?? 0.4,
                  min: 0,
                  max: 1,
                  step: 0.01,
                },
                skyCloudDensity: {
                  label: 'Density',
                  value: initialSnapshot.skyCloudDensity ?? 0.4,
                  min: 0,
                  max: 1,
                  step: 0.01,
                },
                skyCloudElevation: {
                  label: 'Elevation',
                  value: initialSnapshot.skyCloudElevation ?? 0.5,
                  min: 0,
                  max: 1,
                  step: 0.01,
                },
              },
              COLLAPSED
            ),
          },
          COLLAPSED
        ),
        skyboxRotation: {
          label: 'Rotation',
          value: initialSnapshot.skyboxRotation ?? {
            x: initialSnapshot.skyboxRotationX,
            y: initialSnapshot.skyboxRotationY,
            z: initialSnapshot.skyboxRotationZ,
          },
          step: 1,
        },
      },
      COLLAPSED
    ),
    Post: folder(
      {
        Bloom: folder(
          {
            bloomEnabled: {
              label: 'Enabled',
              value: initialSnapshot.bloomEnabled ?? false,
            },
            bloomStrength: {
              label: 'Strength',
              value: initialSnapshot.bloomStrength ?? 0.217,
              min: 0,
              max: 4,
              step: 0.001,
            },
            bloomRadius: {
              label: 'Radius',
              value: initialSnapshot.bloomRadius ?? 0,
              min: 0,
              max: 2,
              step: 0.001,
            },
            bloomThreshold: {
              label: 'Threshold',
              value: initialSnapshot.bloomThreshold ?? 0,
              min: 0,
              max: 2,
              step: 0.001,
            },
            bloomToneMappingExposure: {
              label: 'Exposure',
              value: initialSnapshot.bloomToneMappingExposure ?? 1.2,
              min: 0,
              max: 3,
              step: 0.001,
            },
          },
          COLLAPSED
        ),
        Retro: folder(
          {
            retroEnabled: {
              label: 'Enabled',
              value: initialSnapshot.retroEnabled ?? false,
            },
            retroCurvature: {
              label: 'Curvature',
              value: initialSnapshot.retroCurvature ?? 0.02,
              min: 0,
              max: 0.2,
              step: 0.01,
            },
            retroColorDepthSteps: {
              label: 'Color Depth',
              value: initialSnapshot.retroColorDepthSteps ?? 32,
              min: 4,
              max: 32,
              step: 1,
            },
            retroScanlineIntensity: {
              label: 'Scanlines',
              value: initialSnapshot.retroScanlineIntensity ?? 0.3,
              min: 0,
              max: 1,
              step: 0.01,
            },
            retroScanlineDensity: {
              label: 'Scanline Density',
              value: initialSnapshot.retroScanlineDensity ?? 1,
              min: 0.02,
              max: 1,
              step: 0.01,
            },
            retroScanlineSpeed: {
              label: 'Scanline Speed',
              value: initialSnapshot.retroScanlineSpeed ?? 0,
              min: 0,
              max: 0.1,
              step: 0.01,
            },
            retroVignetteIntensity: {
              label: 'Vignette',
              value: initialSnapshot.retroVignetteIntensity ?? 0.3,
              min: 0,
              max: 1,
              step: 0.01,
            },
            retroColorBleeding: {
              label: 'Color Bleeding',
              value: initialSnapshot.retroColorBleeding ?? 0.001,
              min: 0,
              max: 0.005,
              step: 0.0001,
            },
            retroAffineDistortion: {
              label: 'Affine Distortion',
              value: initialSnapshot.retroAffineDistortion ?? 0,
              min: 0,
              max: 1,
              step: 0.01,
            },
          },
          COLLAPSED
        ),
        'Chromatic Aberration': folder(
          {
            chromaticAberrationEnabled: {
              label: 'Enabled',
              value: initialSnapshot.chromaticAberrationEnabled ?? false,
            },
            chromaticAberrationStrength: {
              label: 'Strength',
              value: initialSnapshot.chromaticAberrationStrength ?? 1.2,
              min: 0,
              max: 8,
              step: 0.01,
            },
            chromaticAberrationScale: {
              label: 'Scale',
              value: initialSnapshot.chromaticAberrationScale ?? 1.25,
              min: 1,
              max: 3,
              step: 0.01,
            },
            chromaticAberrationCenterX: {
              label: 'Center X',
              value: initialSnapshot.chromaticAberrationCenterX ?? 0.5,
              min: 0,
              max: 1,
              step: 0.001,
            },
            chromaticAberrationCenterY: {
              label: 'Center Y',
              value: initialSnapshot.chromaticAberrationCenterY ?? 0.5,
              min: 0,
              max: 1,
              step: 0.001,
            },
          },
          COLLAPSED
        ),
        CCTV: folder(
          {
            surveillanceOverlayEnabled: {
              label: 'Enabled',
              value: initialSnapshot.surveillanceOverlayEnabled,
            },
            surveillanceCameraLabel: {
              label: 'Label',
              value: initialSnapshot.surveillanceCameraLabel || 'CAM 01',
            },
          },
          COLLAPSED
        ),
      },
      COLLAPSED
    ),
  }));

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  const activePreset = PRESETS[controls.preset] || PRESETS[DEFAULT_PRESET];

  // Stable key from only camera-relevant control keys — prevents non-camera leva
  // changes (lighting, etc.) from triggering a camera rebuild and snapping position.
  const cameraControlsKey = useMemo(() => {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(controls).filter(
          ([key]) =>
            key === 'preset' ||
            key.startsWith('camera') ||
            (key.startsWith('orbit') && !key.startsWith('orbitingBodies')) ||
            key.startsWith('spline') ||
            key.startsWith('fixed') ||
            key.startsWith('operator')
        )
      )
    );
  }, [controls]);

  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  return useMemo(() => {
    const skyboxRotation = controls.skyboxRotation ||
      activePreset.skyboxRotation || {
        x: activePreset.skyboxRotationX,
        y: activePreset.skyboxRotationY,
        z: activePreset.skyboxRotationZ,
      };

    return {
      ...activePreset,
      ...controls,
      cameraApiRef,
      cameraAutoFit: camera.cameraAutoFit,
      cameraFar: camera.far,
      cameraFixed: camera.fixed,
      cameraMode: camera.mode,
      cameraNear: camera.near,
      cameraOrbit: camera.orbit,
      cameraSpline: camera.spline,
      fixedCameraShot: camera.fixed.activeShot,
      skyTurbidity: controls.skyTurbidity ?? activePreset.skyTurbidity ?? 8,
      skyRayleigh: controls.skyRayleigh ?? activePreset.skyRayleigh ?? 3,
      skyMieCoefficient:
        controls.skyMieCoefficient ?? activePreset.skyMieCoefficient ?? 0.005,
      skyMieDirectionalG:
        controls.skyMieDirectionalG ?? activePreset.skyMieDirectionalG ?? 0.8,
      skyElevation: controls.skyElevation ?? activePreset.skyElevation ?? 8,
      skyAzimuth: controls.skyAzimuth ?? activePreset.skyAzimuth ?? 180,
      skyShowSunDisc:
        controls.skyShowSunDisc ?? activePreset.skyShowSunDisc ?? true,
      skyCloudCoverage:
        controls.skyCloudCoverage ?? activePreset.skyCloudCoverage ?? 0.4,
      skyCloudDensity:
        controls.skyCloudDensity ?? activePreset.skyCloudDensity ?? 0.4,
      skyCloudElevation:
        controls.skyCloudElevation ?? activePreset.skyCloudElevation ?? 0.5,
      skyboxMode: controls.skyboxMode ?? activePreset.skyboxMode ?? 'night',
      skyboxRotationEnabled:
        controls.skyboxRotationEnabled ??
        activePreset.skyboxRotationEnabled ??
        false,
      skyboxRotationSpeed:
        controls.skyboxRotationSpeed ?? activePreset.skyboxRotationSpeed ?? 2,
      skyboxRotationX: skyboxRotation.x ?? 0,
      skyboxRotationY: skyboxRotation.y ?? 0,
      skyboxRotationZ: skyboxRotation.z ?? 0,
    };
  }, [activePreset, camera, controls]);
}
