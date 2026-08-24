import { useCallback, useEffect, useRef } from 'react';

import { folder, useControls } from 'leva';

import { useSkullControls } from '@elements/Skull/SkullControls';
import usePresetsFolder from '@hooks/usePresetsFolder';
import CAMERA_SPLINE_PRESETS from '@presets/spline/cameraSplinePresets';
import { getRandomNumber } from '@utils/math';

import { PRESETS } from '../presets';

// Key paths used in leva render() functions for conditional visibility.
// Format: '<panelName>.<folderPath>.<controlKey>'
const HALO_TYPE_PATH = 'All My Thoughts Are So Cumulus.Halo.haloType';
const RINGS_STYLE_PATH = 'All My Thoughts Are So Cumulus.Halo.Rings.ringsStyle';
const CAMERA_MODE_PATH =
  'All My Thoughts Are So Cumulus.Scene.Camera.cameraMode';
const ORBIT_CUSTOM_TARGET_PATH =
  'All My Thoughts Are So Cumulus.Scene.Camera.orbitCameraUseCustomTarget';
const DEFAULT_RINGS_INNER_RADIUS = 0.5;
const DEFAULT_RINGS_OUTER_RADIUS = 2;
const DEFAULT_PRESET = 'Default Rings';

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

export default function useSceneControls() {
  const defaultControlsRef = useRef(null);
  const previousHaloTypeRef = useRef('rings');

  const getPresetControls = useCallback(
    ({ currentControls, presetName, presetSnapshot }) => {
      const base = defaultControlsRef.current || {};
      return {
        ...base,
        ...presetSnapshot,
        preset: presetName,
        cameraMode: presetSnapshot.cameraMode ?? currentControls.cameraMode,
        haloScrollEnabled: currentControls.haloScrollEnabled,
        haloScrollInterval: currentControls.haloScrollInterval,
      };
    },
    []
  );

  const {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const [controls, setControls] = useControls(
    'All My Thoughts Are So Cumulus',
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          Environment: folder(
            {
              backgroundColor: {
                label: 'Background Color',
                value: '#ffffff',
              },
              environmentIntensity: {
                label: 'Env Intensity',
                value: 0,
                min: 0,
                max: 2,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Lighting: folder(
            {
              Ambient: folder(
                {
                  ambientIntensity: {
                    label: 'Intensity',
                    value: 0.12,
                    min: 0,
                    max: 2,
                    step: 0.01,
                  },
                },
                { collapsed: true }
              ),
              'Point Light': folder(
                {
                  plPosition: {
                    label: 'Position',
                    value: { x: 3, y: 3, z: 5 },
                  },
                  plDecay: {
                    label: 'Decay',
                    value: 0,
                    min: -10,
                    max: 10,
                    step: 0.1,
                  },
                  plDistance: {
                    label: 'Distance',
                    value: -1,
                    min: -10,
                    max: 10,
                    step: 0.1,
                  },
                  plIntensity: {
                    label: 'Intensity',
                    value: 0.8,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  plCastShadow: { label: 'Cast Shadow', value: true },
                },
                { collapsed: true }
              ),
              Spotlight: folder(
                {
                  spotlightEnabled: {
                    label: 'Enabled',
                    value: false,
                  },
                  spotlightPosition: {
                    label: 'Position',
                    value: { x: -4.5, y: 2.4, z: -5 },
                  },
                  spotlightAngle: {
                    label: 'Angle',
                    value: 0.4,
                    min: 0.05,
                    max: 1.5,
                    step: 0.01,
                  },
                  spotlightPenumbra: {
                    label: 'Penumbra',
                    value: 1,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  spotlightIntensity: {
                    label: 'Intensity',
                    value: 1.35,
                    min: 0,
                    max: 10,
                    step: 0.01,
                  },
                  spotlightColor: {
                    label: 'Color',
                    value: '#d6e5ff',
                  },
                  spotlightCastShadow: {
                    label: 'Cast Shadow',
                    value: false,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),

          'Grid Helpers': folder(
            {
              showGridHelper: { label: 'Show Grid', value: false },
              showPolarGridHelper: { label: 'Show Polar Grid', value: false },
            },
            { collapsed: true }
          ),

          Camera: folder(
            {
              cameraMode: {
                label: 'Mode',
                value: 'orbit',
                options: {
                  Fixed: 'fixed',
                  Orbit: 'orbit',
                  Operator: 'operator',
                  'Spline Motion': 'spline',
                },
              },
              autoRotateSpeed: {
                label: 'Auto Rotate',
                value: 0,
                min: -50,
                max: 50,
                render: (get) => get(CAMERA_MODE_PATH) === 'orbit',
              },
              orbitCameraUseCustomTarget: {
                label: 'Custom Target',
                value: false,
                render: (get) => get(CAMERA_MODE_PATH) === 'orbit',
              },
              orbitCameraTarget: {
                label: 'Orbit Target',
                value: { x: 0, y: 1, z: 0 },
                render: (get) =>
                  get(CAMERA_MODE_PATH) === 'orbit' &&
                  get(ORBIT_CUSTOM_TARGET_PATH),
              },
              'Fixed Camera': folder(
                {
                  fixedCameraDesktopPosition: {
                    label: 'Desktop Position',
                    value: { x: -4.7, y: 2.6, z: 5.9 },
                  },
                  fixedCameraDesktopTarget: {
                    label: 'Desktop Target',
                    value: { x: 0, y: 1, z: 0 },
                  },
                  fixedCameraDesktopFov: {
                    label: 'Desktop FOV',
                    value: 20,
                    min: 5,
                    max: 90,
                    step: 1,
                  },
                  fixedCameraMobilePosition: {
                    label: 'Mobile Position',
                    value: { x: -4, y: 2.4, z: 7 },
                  },
                  fixedCameraMobileTarget: {
                    label: 'Mobile Target',
                    value: { x: 0, y: 0.9, z: 0 },
                  },
                  fixedCameraMobileFov: {
                    label: 'Mobile FOV',
                    value: 26,
                    min: 5,
                    max: 100,
                    step: 1,
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'fixed',
                }
              ),
              Operator: folder(
                {
                  operatorMoveSpeed: {
                    label: 'Move Speed',
                    value: 8,
                    min: 0.5,
                    max: 40,
                    step: 0.1,
                  },
                  operatorLiftSpeed: {
                    label: 'Lift Speed',
                    value: 6,
                    min: 0.5,
                    max: 30,
                    step: 0.1,
                  },
                  operatorBoostMultiplier: {
                    label: 'Boost Multiplier',
                    value: 2.2,
                    min: 1,
                    max: 8,
                    step: 0.1,
                  },
                  operatorPointerLookSensitivity: {
                    label: 'Pointer Look',
                    value: 0.0032,
                    min: 0.0005,
                    max: 0.02,
                    step: 0.0001,
                  },
                  operatorStickLookSpeed: {
                    label: 'Stick Look',
                    value: 2.6,
                    min: 0.1,
                    max: 15,
                    step: 0.1,
                  },
                  operatorZoomSpeed: {
                    label: 'Zoom Speed',
                    value: 32,
                    min: 1,
                    max: 120,
                    step: 0.5,
                  },
                  operatorMinFov: {
                    label: 'Min FOV',
                    value: 24,
                    min: 5,
                    max: 90,
                    step: 1,
                  },
                  operatorMaxFov: {
                    label: 'Max FOV',
                    value: 80,
                    min: 5,
                    max: 120,
                    step: 1,
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'operator',
                }
              ),
              'Spline Motion': folder(
                {
                  cameraSplinePreset: {
                    label: 'Path',
                    value: 'Loop de Loop',
                    options: Object.keys(CAMERA_SPLINE_PRESETS),
                  },
                  cameraSplineShowPath: {
                    label: 'Show Path',
                    value: false,
                  },
                  cameraSplinePathColor: {
                    label: 'Path Color',
                    value: '#00ffff',
                  },
                  cameraSplinePathWidth: {
                    label: 'Path Width',
                    value: 2,
                    min: 1,
                    max: 8,
                    step: 1,
                  },
                  cameraSplinePosition: {
                    label: 'Position',
                    value: { x: 0, y: 1, z: 0 },
                  },
                  cameraSplineScale: {
                    label: 'Scale',
                    value: { x: 2, y: 1, z: 3 },
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                  },
                  cameraSplineDuration: {
                    label: 'Loop Duration (s)',
                    value: 30,
                    min: 5,
                    max: 120,
                    step: 1,
                  },
                  cameraSplineTension: {
                    label: 'Curve Tension',
                    value: 0.5,
                    min: 0,
                    max: 1,
                    step: 0.1,
                  },
                  cameraSplineLookAt: {
                    label: 'Look At',
                    value: { x: 0, y: 1, z: 0 },
                  },
                },
                {
                  collapsed: true,
                  render: (get) => get(CAMERA_MODE_PATH) === 'spline',
                }
              ),
            },
            { collapsed: true }
          ),

          Animations: folder(
            {
              'Halo Animation': folder(
                {
                  animate: { label: 'Rotate', value: true },
                  speed: {
                    label: 'RPM',
                    value: 33,
                    min: 0,
                    max: 78,
                    step: 1,
                  },
                  wobble: { label: 'Wobble', value: false },
                  wobbleSpeed: {
                    label: 'Wobble Speed',
                    value: 1,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  wobbleAngle: {
                    label: 'Wobble Angle',
                    value: 5,
                    min: 0,
                    max: 15,
                    step: 1,
                  },
                },
                { collapsed: true }
              ),
              floatSpeed: {
                label: 'Float Speed',
                value: 0.5,
                min: 0,
                max: 1,
                step: 0.01,
              },
              haloScrollEnabled: { label: 'Halo Scroll', value: false },
              haloScrollInterval: {
                label: 'Scroll Interval (s)',
                value: 2,
                min: 0.5,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),

          Post: folder(
            {
              Bloom: folder(
                {
                  bloomEnabled: {
                    label: 'Enabled',
                    value: true,
                  },
                  bloomIntensity: {
                    label: 'Intensity',
                    value: 1.1,
                    min: 0,
                    max: 4,
                    step: 0.01,
                  },
                  bloomLuminanceThreshold: {
                    label: 'Threshold',
                    value: 0.3,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  bloomLuminanceSmoothing: {
                    label: 'Smoothing',
                    value: 0.28,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  bloomRadius: {
                    label: 'Radius',
                    value: 0.68,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                },
                {
                  collapsed: true,
                  render: (get) =>
                    ['crtStaticRing', 'solarSystem'].includes(
                      get(HALO_TYPE_PATH)
                    ),
                }
              ),
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Halo: folder(
        {
          haloType: {
            label: 'Type',
            value: 'rings',
            options: {
              Rings: 'rings',
              Record: 'record',
              Network: 'network',
              Plate: 'plate',
              Atomic: 'atomic',
              Static: 'crtStaticRing',
              'Solar System': 'solarSystem',
            },
          },

          Rings: folder(
            {
              Appearance: folder(
                {
                  ringsPosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  ringsRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 0 },
                  },
                  ringsVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              ringsScale: {
                label: 'Scale',
                value: 0.9,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              ringsStyle: {
                label: 'Style',
                value: 'default',
                options: { Default: 'default', Gradient: 'gradient' },
              },
              ringsInnerRadius: {
                label: 'Inner Radius',
                value: 0.5,
                min: 0.1,
                max: 2,
                step: 0.1,
              },
              ringsOuterRadius: {
                label: 'Outer Radius',
                value: 2,
                min: 0.5,
                max: 20,
                step: 0.1,
              },
              ringsStart: {
                label: 'Start Color',
                value: '#FFFFFF',
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsEnd: {
                label: 'End Color',
                value: '#000000',
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsSteps: {
                label: 'Steps',
                value: 8,
                min: 2,
                max: 20,
                step: 1,
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsSm: {
                label: 'SM Width',
                value: 0.1,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsMed: {
                label: 'MED Width',
                value: 1,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsLg: {
                label: 'LG Width',
                value: 2,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsXl: {
                label: 'XL Width',
                value: 3,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsSilver: {
                label: 'Silver',
                value: '#c1c1c1',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsWhite: {
                label: 'White',
                value: '#ffffff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsBlack: {
                label: 'Black',
                value: '#000000',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsBlue: {
                label: 'Blue',
                value: '#0023ff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsLightblue: {
                label: 'Light Blue',
                value: '#69d8ff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'rings',
            }
          ),

          Record: folder(
            {
              Appearance: folder(
                {
                  recordPosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  recordRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 0 },
                  },
                  recordVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              recordScale: {
                label: 'Scale',
                value: 12,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              recordSideA: {
                label: 'Side',
                value: true,
                options: { 'Side A': true, 'Side B': false },
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'record',
            }
          ),

          Network: folder(
            {
              Appearance: folder(
                {
                  networkPosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  networkRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 0 },
                  },
                  networkVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              networkScale: {
                label: 'Scale',
                value: 0.53,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              networkPointColor: {
                label: 'Point Color',
                value: '#ff0000',
              },
              networkLineColor: {
                label: 'Line Color',
                value: '#000000',
              },
              networkPointSize: {
                label: 'Point Size',
                value: 2.5,
                min: 0.5,
                max: 10,
                step: 0.5,
              },
              networkParticleCount: {
                label: 'Particles',
                value: 500,
                min: 50,
                max: 1000,
                step: 50,
              },
              networkMaxDistance: {
                label: 'Max Distance',
                value: 0.8,
                min: 0.1,
                max: 2,
                step: 0.1,
              },
              networkAngularSpeed: {
                label: 'Angular Speed',
                value: 0.53,
                min: 0,
                max: 3,
                step: 0.01,
              },
              networkTimeScale: {
                label: 'Time Scale',
                value: 0.4,
                min: 0,
                max: 2,
                step: 0.05,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'network',
            }
          ),

          Atom: folder(
            {
              Appearance: folder(
                {
                  atomPosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  atomRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 0 },
                  },
                  atomVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              atomScale: {
                label: 'Scale',
                value: 1.05,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              atomicNumber: {
                label: 'Atomic Number',
                value: 8,
                min: 1,
                max: 36,
                step: 1,
              },
              atomAnimateElectrons: {
                label: 'Animate Electrons',
                value: true,
              },
              atomShellSpacing: {
                label: 'Shell Spacing',
                value: 0.65,
                min: 0.1,
                max: 2,
                step: 0.05,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'atomic',
            }
          ),

          Plate: folder(
            {
              Appearance: folder(
                {
                  platePosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  plateRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 1 },
                  },
                  plateVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              plateScale: {
                label: 'Scale',
                value: 0.18,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'plate',
            }
          ),

          Static: folder(
            {
              Appearance: folder(
                {
                  crtStaticRingPosition: {
                    label: 'Position',
                    value: { x: 0, y: 1.5, z: -1 },
                  },
                  crtStaticRingRotation: {
                    label: 'Rotation',
                    value: { x: 45, y: 0, z: 0 },
                  },
                  crtStaticRingVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              crtStaticRingScale: {
                label: 'Scale',
                value: 0.9,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              crtStaticRingInnerRadius: {
                label: 'Inner Radius',
                value: DEFAULT_RINGS_INNER_RADIUS,
                min: 0.1,
                max: 15,
                step: 0.01,
              },
              crtStaticRingOuterRadius: {
                label: 'Outer Radius',
                value: DEFAULT_RINGS_OUTER_RADIUS,
                min: 0.1,
                max: 15,
                step: 0.01,
              },
              crtStaticRingSnowAmount: {
                label: 'Snow Amount',
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
              },
              crtStaticRingSnowScale: {
                label: 'Snow Scale',
                value: 180,
                min: 10,
                max: 800,
                step: 10,
              },
              crtStaticRingSnowSpeed: {
                label: 'Snow Speed',
                value: 1,
                min: 0,
                max: 5,
                step: 0.1,
              },
              crtStaticRingSnowSize: {
                label: 'Snow Size',
                value: 240,
                min: 40,
                max: 1000,
                step: 20,
              },
              crtStaticRingSnap: {
                label: 'Snap',
                value: 24,
                min: 1,
                max: 60,
                step: 1,
              },
              crtStaticRingBandStrength: {
                label: 'Band Strength',
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
              },
              crtStaticRingBandSpeed: {
                label: 'Band Speed',
                value: 0.6,
                min: 0,
                max: 3,
                step: 0.1,
              },
              crtStaticRingBandScale: {
                label: 'Band Scale',
                value: 8,
                min: 1,
                max: 40,
                step: 1,
              },
              crtStaticRingRFStrength: {
                label: 'RF Strength',
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
              },
              crtStaticRingRFScale: {
                label: 'RF Scale',
                value: 22,
                min: 2,
                max: 80,
                step: 1,
              },
              crtStaticRingRFSpeed: {
                label: 'RF Speed',
                value: 0.4,
                min: 0,
                max: 3,
                step: 0.1,
              },
              crtStaticRingCurvature: {
                label: 'Curvature',
                value: 0,
                min: 0,
                max: 0.4,
                step: 0.01,
              },
              crtStaticRingVignette: {
                label: 'Vignette',
                value: 0.92,
                min: 0.6,
                max: 0.98,
                step: 0.01,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'crtStaticRing',
            }
          ),

          'Solar System': folder(
            {
              Appearance: folder(
                {
                  solarSystemPosition: {
                    label: 'Position',
                    value: { x: 0, y: 0.75, z: 0 },
                  },
                  solarSystemRotation: {
                    label: 'Rotation',
                    value: { x: 0, y: 0, z: 0 },
                  },
                  solarSystemVisible: { label: 'Visible', value: true },
                },
                { collapsed: true }
              ),
              solarSystemScale: {
                label: 'Scale',
                value: 0.18,
                min: 0.01,
                max: 2,
                step: 0.01,
              },
              solarSystemOrbitSpeed: {
                label: 'Orbit Speed',
                value: 1,
                min: 0,
                max: 5,
                step: 0.01,
              },
              solarSystemRotationSpeed: {
                label: 'Spin Speed',
                value: 1,
                min: 0,
                max: 5,
                step: 0.01,
              },
              solarSystemShowOrbits: {
                label: 'Show Orbits',
                value: true,
              },
              solarSystemOrbitOpacity: {
                label: 'Orbit Opacity',
                value: 0.14,
                min: 0,
                max: 1,
                step: 0.01,
              },
              solarSystemOrbitColor: {
                label: 'Orbit Color',
                value: '#8ea2ff',
              },
              solarSystemAsteroidBeltsVisible: {
                label: 'Asteroid Belts',
                value: true,
              },
              solarSystemAsteroidMode: {
                label: 'Asteroid Mode',
                value: 'mesh',
                options: {
                  'Instanced Rocks': 'mesh',
                  'Sprite Impostors': 'sprite',
                },
              },
              solarSystemShadowsEnabled: {
                label: 'Shadows',
                value: false,
              },
              solarSystemSunRadius: {
                label: 'Sun Radius',
                value: 0.48,
                min: 0.1,
                max: 1.2,
                step: 0.01,
              },
              solarSystemSunSurfaceDetailScale: {
                label: 'Surface Detail',
                value: 1,
                min: 0.25,
                max: 2,
                step: 0.01,
              },
              solarSystemSunSurfaceDisplacementScale: {
                label: 'Surface Displacement',
                value: 0.15,
                min: 0.01,
                max: 0.35,
                step: 0.005,
              },
              solarSystemSunEmissiveIntensity: {
                label: 'Sun Glow',
                value: 2.8,
                min: 0,
                max: 8,
                step: 0.05,
              },
              solarSystemSunLightIntensity: {
                label: 'Sun Light',
                value: 18,
                min: 0,
                max: 100,
                step: 0.5,
              },
              solarSystemSunLightColor: {
                label: 'Sun Light Color',
                value: '#ffcf37',
              },
              solarSystemSunLightDecay: {
                label: 'Sun Light Decay',
                value: 2,
                min: 0,
                max: 4,
                step: 0.01,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'solarSystem',
            }
          ),
        },
        { collapsed: true }
      ),

      Cloud: folder(
        {
          'Cloud Appearance': folder(
            {
              cloudPosition: {
                label: 'Position',
                value: { x: 0, y: 0.75, z: 0 },
              },
              cloudRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: 0 },
              },
              cloudScale: {
                label: 'Scale',
                value: 0.15,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
              cloudVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
          cloudSeed: {
            label: 'Seed',
            value: getRandomNumber(1, 100),
            min: 1,
            max: 100,
            step: 1,
          },
          cloudSegments: {
            label: 'Segments',
            value: 50,
            min: 1,
            max: 80,
            step: 1,
          },
          cloudVolume: {
            label: 'Volume',
            value: 6,
            min: 0,
            max: 100,
            step: 0.1,
          },
          cloudOpacity: {
            label: 'Opacity',
            value: 0.8,
            min: 0,
            max: 1,
            step: 0.01,
          },
          cloudFade: { label: 'Fade', value: 0, min: 0, max: 400, step: 1 },
          cloudGrowth: { label: 'Growth', value: 4, min: 0, max: 20, step: 1 },
          cloudSpeed: {
            label: 'Speed',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          cloudBoundsX: {
            label: 'Bounds X',
            value: 6,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudBoundsY: {
            label: 'Bounds Y',
            value: 1,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudBoundsZ: {
            label: 'Bounds Z',
            value: 1,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudColor: { label: 'Color', value: '#bababa' },
        },
        { collapsed: true }
      ),

      Skull: folder(
        {
          'Skull Appearance': folder(
            {
              skullPosition: { label: 'Position', value: { x: 0, y: 0, z: 0 } },
              skullRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
              skullScale: {
                label: 'Scale',
                value: 0.1,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
              skullVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
          Bones: useSkullControls({
            collapsed: true,
            cranium: {
              showRightParietal: false,
              showRightTemporal: false,
              showTeeth: false,
              showLeftParietal: false,
              showLeftTemporal: false,
            },
            mandible: { showMandible: false },
          }),
        },
        { collapsed: true }
      ),

      Femur: folder(
        {
          Appearance: folder(
            {
              femurPosition: {
                label: 'Position',
                value: { x: 0.3, y: 0, z: -0.6 },
              },
              femurRotation: {
                label: 'Rotation',
                value: { x: -8, y: 173, z: -26 },
              },
              femurScale: {
                label: 'Scale',
                value: 0.75,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              femurVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      'Censor Panel': folder(
        {
          Appearance: folder(
            {
              censorPanelVisible: { label: 'Visible', value: true },
              censorPanelPosition: {
                label: 'Position',
                value: { x: -1, y: 2.2, z: -0.25 },
              },
              censorPanelRotation: {
                label: 'Rotation',
                value: { x: 45, y: 0, z: 0 },
              },
              censorPanelScale: {
                label: 'Scale',
                value: 2.2,
                min: 0.1,
                max: 5,
                step: 0.05,
              },
            },
            { collapsed: true }
          ),
          Censor: folder(
            {
              censorPixelSize: {
                label: 'Pixel Size',
                value: 20,
                min: 1,
                max: 64,
                step: 1,
              },
              censorRefraction: {
                label: 'Refraction',
                value: 0,
                min: 0,
                max: 0.15,
                step: 0.005,
              },
              censorClipOffset: {
                label: 'Clip Offset',
                value: 2,
                min: -2,
                max: 2,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    if (!defaultControlsRef.current) {
      defaultControlsRef.current = cloneSnapshot(controls);
    }
  }, [controls]);

  useEffect(() => {
    applyPresetByName(selectedPreset, { currentControls: controls });
  }, [applyPresetByName, selectedPreset]);

  useEffect(() => {
    const hasHaloTypeChanged =
      previousHaloTypeRef.current !== controls.haloType;
    previousHaloTypeRef.current = controls.haloType;

    if (!hasHaloTypeChanged) {
      return;
    }

    if (controls.haloType === 'atomic') {
      const isLegacyAtomicRotation =
        controls.atomRotation?.x === -45 &&
        controls.atomRotation?.y === 0 &&
        controls.atomRotation?.z === 0;

      if (isLegacyAtomicRotation) {
        setControls({ atomRotation: { x: 45, y: 0, z: 0 } });
      }
    }

    if (controls.haloType === 'network') {
      const isLegacyNetworkRotation =
        controls.networkRotation?.x === -45 &&
        controls.networkRotation?.y === 0 &&
        controls.networkRotation?.z === 0;

      if (isLegacyNetworkRotation) {
        setControls({ networkRotation: { x: 45, y: 0, z: 0 } });
      }
    }
  }, [
    controls.haloType,
    controls.atomRotation,
    controls.networkRotation,
    setControls,
  ]);

  return { controls, setControls, controlsSnapshotRef };
}
