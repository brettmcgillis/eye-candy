import { useEffect, useMemo, useRef, useState } from 'react';

import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import {
  DEFAULT_SPLINE_CONFIG as BASE_DEFAULT_SPLINE_CONFIG,
  updateSplineConfig,
} from '@elements/splineGroup/splineDefaults';
import usePresetsFolder from '@hooks/usePresetsFolder';

import { SCENE_PRESETS } from '../presets/presets';

const SCENE_PRESET_NAMES = Object.keys(SCENE_PRESETS);
const DEFAULT_SCENE_PRESET = SCENE_PRESET_NAMES[0];

function getPresetControls({ presetSnapshot }) {
  return presetSnapshot;
}

const DEFAULT_SPLINE_CONFIG = {
  ...BASE_DEFAULT_SPLINE_CONFIG,
  type: 'Smoke',
  smokeType: 'Particle',
  tension: 0.6,
  closed: false,
  showSpline: false,
  showHelpers: false,
  arcSegments: 200,
  particleCount: 3000,
  particleSize: 0.4,
  particleColor: '#a8a8a0',
  opacity: 0.35,
  growth: 2.0,
  fadeExponent: 1.0,
  springK: 1.0,
  flowSpeed: 0.15,
  damping: 0.93,
  turbulence: 0.5,
  turbulenceSpeed: 0.3,
  spawnSpread: 0.3,
  maxDrift: 2,
  fadeRate: 1.5,
  buoyancy: 0,
  rotSpeed: 0,
  blendMode: 'Normal',
  volParticleCount: 3000,
  volSize: 0.6,
  volColor: '#9090a0',
  volOpacity: 0.06,
  volFlowSpeed: 0.04,
  volFadeRate: 8,
  volSpread: 0.3,
  volSpringK: 1.0,
  volDamping: 0.9,
  volTurbulence: 0.5,
  volTurbulenceSpeed: 0.25,
  volMaxDrift: 2,
  volGrowth: 1.5,
  volFadeExp: 1.2,
  volBuoyancy: 0,
  volBlendMode: 'Normal',
};

export { DEFAULT_SPLINE_CONFIG };

export default function useSceneControls(
  splines,
  setSplines,
  initialSplineConfigs
) {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_SCENE_PRESET,
    getPresetControls,
    presets: SCENE_PRESETS,
  });

  const D = SCENE_PRESETS[initialPreset];

  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineConfigs, setSplineConfigs] = useState(
    () =>
      initialSplineConfigs || splines.map(() => ({ ...DEFAULT_SPLINE_CONFIG }))
  );

  const [controls, setControls] = useControls(
    'Still Pulling For You',
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          backgroundColor: {
            label: 'Background',
            value: D.backgroundColor,
          },
          cameraMode: {
            label: 'Camera',
            value: D.cameraMode,
            options: ['Fixed', 'Orbit'],
          },
          Lighting: folder(
            {
              ambientIntensity: {
                label: 'Ambient',
                value: D.ambientIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
              mainLightIntensity: {
                label: 'Main Light',
                value: D.mainLightIntensity,
                min: 0,
                max: 3,
                step: 0.05,
              },
              fillLightIntensity: {
                label: 'Fill Light',
                value: D.fillLightIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Tugboat: folder(
        {
          boatMode: {
            label: 'Mode',
            value: D.boatMode,
            options: ['Fixed', 'Floating'],
          },
          boatVisible: {
            label: 'Visible',
            value: D.boatVisible,
          },
          Orientation: folder(
            {
              boatPosition: {
                label: 'Position',
                value: D.boatPosition,
                step: 0.05,
              },
              boatRotation: {
                label: 'Rotation',
                value: D.boatRotation,
                min: -Math.PI,
                max: Math.PI,
                step: 0.05,
              },
              boatScale: {
                label: 'Scale',
                value: D.boatScale,
                min: 0.01,
                max: 0.5,
                step: 0.005,
              },
              floatDraft: {
                label: 'Float Draft',
                value: D.floatDraft,
                min: -1,
                max: 1,
                step: 0.01,
              },
              tiltDamping: {
                label: 'Tilt Damping',
                value: D.tiltDamping,
                min: 0,
                max: 1,
                step: 0.05,
              },
            },
            { collapsed: true }
          ),
          'Flag Cloth': folder(
            {
              flagVisible: {
                label: 'Visible',
                value: D.flagVisible,
              },
              flagReverseWidth: {
                label: 'Reverse Width',
                value: D.flagReverseWidth,
              },
              flagWidthScale: {
                label: 'Width Scale',
                value: D.flagWidthScale,
                min: 0.5,
                max: 4,
                step: 0.05,
              },
              flagHeightScale: {
                label: 'Height Scale',
                value: D.flagHeightScale,
                min: 0.5,
                max: 8,
                step: 0.05,
              },
              flagSegmentsX: {
                label: 'Segments X',
                value: D.flagSegmentsX,
                min: 6,
                max: 32,
                step: 1,
              },
              flagSegmentsY: {
                label: 'Segments Y',
                value: D.flagSegmentsY,
                min: 8,
                max: 40,
                step: 1,
              },
              Appearance: folder(
                {
                  flagColor: {
                    label: 'Color',
                    value: D.flagColor,
                  },
                  flagOpacity: {
                    label: 'Opacity',
                    value: D.flagOpacity,
                    min: 0.1,
                    max: 1,
                    step: 0.01,
                  },
                  flagRoughness: {
                    label: 'Roughness',
                    value: D.flagRoughness,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  flagMetalness: {
                    label: 'Metalness',
                    value: D.flagMetalness,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                },
                { collapsed: true }
              ),
              Physics: folder(
                {
                  flagGravity: {
                    label: 'Gravity',
                    value: D.flagGravity,
                    min: 0,
                    max: 0.001,
                    step: 0.00001,
                  },
                  flagWind: {
                    label: 'Wind',
                    value: D.flagWind,
                    min: 0,
                    max: 8,
                    step: 0.05,
                  },
                  flagWindDirX: {
                    label: 'Wind X',
                    value: D.flagWindDirX,
                    min: -1,
                    max: 1,
                    step: 0.05,
                  },
                  flagWindDirZ: {
                    label: 'Wind Z',
                    value: D.flagWindDirZ,
                    min: -1,
                    max: 1,
                    step: 0.05,
                  },
                  flagStiffness: {
                    label: 'Stiffness',
                    value: D.flagStiffness,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  flagDampening: {
                    label: 'Dampening',
                    value: D.flagDampening,
                    min: 0.85,
                    max: 1,
                    step: 0.001,
                  },
                  flagMaxVelocity: {
                    label: 'Max Velocity',
                    value: D.flagMaxVelocity,
                    min: 0.001,
                    max: 0.05,
                    step: 0.001,
                  },
                  flagCursorCollider: {
                    label: 'Cursor Collider',
                    value: D.flagCursorCollider,
                  },
                  flagCursorRadius: {
                    label: 'Cursor Radius',
                    value: D.flagCursorRadius,
                    min: 0.02,
                    max: 0.4,
                    step: 0.01,
                  },
                  flagPaused: {
                    label: 'Paused',
                    value: D.flagPaused,
                  },
                  flagFreezeAfterMs: {
                    label: 'Freeze After Ms',
                    value: D.flagFreezeAfterMs,
                    min: 0,
                    max: 4000,
                    step: 50,
                  },
                },
                { collapsed: true }
              ),
              Water: folder(
                {
                  flagWaterContactEnabled: {
                    label: 'Contact Enabled',
                    value: D.flagWaterContactEnabled,
                  },
                  flagWaterContactRadius: {
                    label: 'Radius',
                    value: D.flagWaterContactRadius,
                    min: 0.01,
                    max: 0.2,
                    step: 0.005,
                  },
                  flagWaterContactPoints: {
                    label: 'Points',
                    value: D.flagWaterContactPoints,
                    min: 1,
                    max: 5,
                    step: 1,
                  },
                  flagWaterContactSpanStart: {
                    label: 'Span Start',
                    value: D.flagWaterContactSpanStart,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  flagWaterContactSpanEnd: {
                    label: 'Span End',
                    value: D.flagWaterContactSpanEnd,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  flagWaterContactLift: {
                    label: 'Lift',
                    value: D.flagWaterContactLift,
                    min: 0,
                    max: 0.1,
                    step: 0.001,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
          Lights: folder(
            {
              lightDebug: {
                label: 'Debug',
                value: D.lightDebug,
              },
              Headlight: folder(
                {
                  headlightVisible: {
                    label: 'Visible',
                    value: D.headlightVisible,
                  },
                  headlightX: {
                    label: 'X',
                    value: D.headlightX,
                    min: -15,
                    max: 15,
                    step: 0.5,
                  },
                  headlightY: {
                    label: 'Y',
                    value: D.headlightY,
                    min: -15,
                    max: 15,
                    step: 0.5,
                  },
                  headlightZ: {
                    label: 'Z',
                    value: D.headlightZ,
                    min: -15,
                    max: 15,
                    step: 0.5,
                  },
                  headlightIntensity: {
                    label: 'Intensity',
                    value: D.headlightIntensity,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  headlightDistance: {
                    label: 'Distance',
                    value: D.headlightDistance,
                    min: 0,
                    max: 30,
                    step: 0.5,
                  },
                  headlightColor: {
                    label: 'Color',
                    value: D.headlightColor,
                  },
                  headlightMode: {
                    label: 'Mode',
                    value: D.headlightMode,
                    options: ['static', 'shorting', 'dying'],
                  },
                },
                { collapsed: true }
              ),
              Cabin: folder(
                {
                  cabinVisible: {
                    label: 'Visible',
                    value: D.cabinVisible,
                  },
                  cabinX: {
                    label: 'X',
                    value: D.cabinX,
                    min: -15,
                    max: 15,
                    step: 0.05,
                  },
                  cabinY: {
                    label: 'Y',
                    value: D.cabinY,
                    min: -15,
                    max: 15,
                    step: 0.05,
                  },
                  cabinZ: {
                    label: 'Z',
                    value: D.cabinZ,
                    min: -15,
                    max: 15,
                    step: 0.05,
                  },
                  cabinIntensity: {
                    label: 'Intensity',
                    value: D.cabinIntensity,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  cabinDistance: {
                    label: 'Distance',
                    value: D.cabinDistance,
                    min: 0,
                    max: 30,
                    step: 0.5,
                  },
                  cabinColor: {
                    label: 'Color',
                    value: D.cabinColor,
                  },
                  cabinMode: {
                    label: 'Mode',
                    value: D.cabinMode,
                    options: ['static', 'shorting', 'dying'],
                  },
                },
                { collapsed: true }
              ),
              Sparkles: folder(
                {
                  sparklesVisible: {
                    label: 'Visible',
                    value: D.sparklesVisible,
                  },
                  sparklesCount: {
                    label: 'Count',
                    value: D.sparklesCount,
                    min: 1,
                    max: 50,
                    step: 1,
                  },
                  sparklesSize: {
                    label: 'Size',
                    value: D.sparklesSize,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                  },
                  sparklesSpeed: {
                    label: 'Speed',
                    value: D.sparklesSpeed,
                    min: 0,
                    max: 5,
                    step: 0.1,
                  },
                  sparklesScale: {
                    label: 'Scale',
                    value: D.sparklesScale,
                    min: 0.5,
                    max: 20,
                    step: 0.5,
                  },
                  sparklesColor: {
                    label: 'Color',
                    value: D.sparklesColor,
                  },
                  sparklesIntensity: {
                    label: 'Intensity',
                    value: D.sparklesIntensity,
                    min: 0.5,
                    max: 10,
                    step: 0.1,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Smoke: folder(
        {
          smokeVisible: {
            label: 'Visible',
            value: D.smokeVisible,
          },
          editSplines: {
            label: 'Edit Splines',
            value: D.editSplines,
          },

          'Spline Actions': folder(
            {
              addSpline: button(
                () => {
                  const randPt = () => ({
                    position: new THREE.Vector3(
                      (Math.random() - 0.5) * 2,
                      0.5 + Math.random() * 2,
                      (Math.random() - 0.5) * 2
                    ),
                    rotation: new THREE.Euler(),
                    scale: new THREE.Vector3(1, 1, 1),
                  });
                  setSplines((prev) => [
                    ...prev,
                    [randPt(), randPt(), randPt()],
                  ]);
                  setSplineConfigs((prev) => [
                    ...prev,
                    {
                      ...DEFAULT_SPLINE_CONFIG,
                      name: `Spline ${prev.length + 1}`,
                    },
                  ]);
                },
                { label: 'Add Spline' }
              ),
              exportSplines: button(
                () => {
                  const all = splinesRef.current;
                  const configs = splineConfigs;
                  const splinesCode = all
                    .map((pts, idx) => {
                      const cfg = configs[idx] ?? DEFAULT_SPLINE_CONFIG;
                      const pointStrs = pts.map((pt) => {
                        const p = pt.position;
                        const r = pt.rotation ?? new THREE.Euler();
                        const s = pt.scale ?? new THREE.Vector3(1, 1, 1);
                        return `      { position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}), rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}), scale: new THREE.Vector3(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}) }`;
                      });
                      const cfgLines = Object.entries(cfg)
                        .filter(
                          ([k]) =>
                            ![
                              'name',
                              'showSpline',
                              'showHelpers',
                              'showSmokeVolume',
                              'showFireVolume',
                            ].includes(k)
                        )
                        .map(([k, v]) =>
                          typeof v === 'string'
                            ? `    ${k}: '${v}'`
                            : `    ${k}: ${v}`
                        );
                      return `  {\n    name: '${cfg.name}',\n${cfgLines.join(',\n')},\n    points: [\n${pointStrs.join(',\n')}\n    ]\n  }`;
                    })
                    .join(',\n');
                  const code = `[\n${splinesCode}\n]`;
                  navigator.clipboard.writeText(code);
                },
                { label: 'Export (copy)' }
              ),
            },
            { collapsed: true }
          ),

          // Per-spline folders — rebuilt when spline count changes
          ...splines.reduce((acc, _, index) => {
            const cfg = splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;
            acc[`Spline ${index + 1}`] = folder(
              {
                [`name_${index}`]: {
                  label: 'Name',
                  value: cfg.name ?? '',
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'name', v),
                },
                [`smokeType_${index}`]: {
                  label: 'Type',
                  value: cfg.smokeType ?? 'Particle',
                  options: ['Particle', 'Volumetric'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'smokeType', v),
                },
                [`Particle Smoke ${index}`]: folder(
                  {
                    [`particleCount_${index}`]: {
                      label: 'Count',
                      value: cfg.particleCount,
                      min: 100,
                      max: 10000,
                      step: 100,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'particleCount',
                          v
                        ),
                    },
                    [`particleSize_${index}`]: {
                      label: 'Size',
                      value: cfg.particleSize,
                      min: 0.05,
                      max: 2,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'particleSize',
                          v
                        ),
                    },
                    [`particleColor_${index}`]: {
                      label: 'Color',
                      value: cfg.particleColor,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'particleColor',
                          v
                        ),
                    },
                    [`opacity_${index}`]: {
                      label: 'Opacity',
                      value: cfg.opacity,
                      min: 0,
                      max: 1,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'opacity',
                          v
                        ),
                    },
                    [`growth_${index}`]: {
                      label: 'Growth',
                      value: cfg.growth,
                      min: 0,
                      max: 10,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'growth',
                          v
                        ),
                    },
                    [`fadeExponent_${index}`]: {
                      label: 'Fade Exponent',
                      value: cfg.fadeExponent,
                      min: 0.1,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'fadeExponent',
                          v
                        ),
                    },
                    [`springK_${index}`]: {
                      label: 'Spring K',
                      value: cfg.springK,
                      min: 0,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'springK',
                          v
                        ),
                    },
                    [`flowSpeed_${index}`]: {
                      label: 'Flow Speed',
                      value: cfg.flowSpeed,
                      min: 0,
                      max: 1,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'flowSpeed',
                          v
                        ),
                    },
                    [`damping_${index}`]: {
                      label: 'Damping',
                      value: cfg.damping,
                      min: 0,
                      max: 1,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'damping',
                          v
                        ),
                    },
                    [`turbulence_${index}`]: {
                      label: 'Turbulence',
                      value: cfg.turbulence,
                      min: 0,
                      max: 3,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'turbulence',
                          v
                        ),
                    },
                    [`turbulenceSpeed_${index}`]: {
                      label: 'Turbulence Speed',
                      value: cfg.turbulenceSpeed,
                      min: 0,
                      max: 2,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'turbulenceSpeed',
                          v
                        ),
                    },
                    [`fadeRate_${index}`]: {
                      label: 'Fade Rate',
                      value: cfg.fadeRate,
                      min: 0,
                      max: 10,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'fadeRate',
                          v
                        ),
                    },
                    [`spawnSpread_${index}`]: {
                      label: 'Spawn Spread',
                      value: cfg.spawnSpread,
                      min: 0,
                      max: 5,
                      step: 0.05,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'spawnSpread',
                          v
                        ),
                    },
                    [`maxDrift_${index}`]: {
                      label: 'Max Drift',
                      value: cfg.maxDrift,
                      min: 0.5,
                      max: 20,
                      step: 0.5,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'maxDrift',
                          v
                        ),
                    },
                    [`buoyancy_${index}`]: {
                      label: 'Buoyancy',
                      value: cfg.buoyancy,
                      min: -5,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'buoyancy',
                          v
                        ),
                    },
                    [`rotSpeed_${index}`]: {
                      label: 'Rotation Speed',
                      value: cfg.rotSpeed,
                      min: 0,
                      max: 5,
                      step: 0.05,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'rotSpeed',
                          v
                        ),
                    },
                    [`blendMode_${index}`]: {
                      label: 'Blend Mode',
                      value: cfg.blendMode,
                      options: [
                        'Normal',
                        'Additive',
                        'Subtractive',
                        'Multiply',
                      ],
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'blendMode',
                          v
                        ),
                    },
                  },
                  { collapsed: true }
                ),
                [`Volumetric Smoke ${index}`]: folder(
                  {
                    [`volParticleCount_${index}`]: {
                      label: 'Count',
                      value: cfg.volParticleCount,
                      min: 100,
                      max: 10000,
                      step: 100,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volParticleCount',
                          v
                        ),
                    },
                    [`volSize_${index}`]: {
                      label: 'Size',
                      value: cfg.volSize,
                      min: 0.05,
                      max: 3,
                      step: 0.05,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volSize',
                          v
                        ),
                    },
                    [`volColor_${index}`]: {
                      label: 'Color',
                      value: cfg.volColor,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volColor',
                          v
                        ),
                    },
                    [`volOpacity_${index}`]: {
                      label: 'Opacity',
                      value: cfg.volOpacity,
                      min: 0.005,
                      max: 1,
                      step: 0.005,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volOpacity',
                          v
                        ),
                    },
                    [`volSpread_${index}`]: {
                      label: 'Spread',
                      value: cfg.volSpread,
                      min: 0,
                      max: 5,
                      step: 0.05,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volSpread',
                          v
                        ),
                    },
                    [`volFlowSpeed_${index}`]: {
                      label: 'Flow Speed',
                      value: cfg.volFlowSpeed,
                      min: 0,
                      max: 0.5,
                      step: 0.005,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volFlowSpeed',
                          v
                        ),
                    },
                    [`volFadeRate_${index}`]: {
                      label: 'Fade Rate',
                      value: cfg.volFadeRate,
                      min: 0,
                      max: 50,
                      step: 1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volFadeRate',
                          v
                        ),
                    },
                    [`volSpringK_${index}`]: {
                      label: 'Spring K',
                      value: cfg.volSpringK,
                      min: 0,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volSpringK',
                          v
                        ),
                    },
                    [`volDamping_${index}`]: {
                      label: 'Damping',
                      value: cfg.volDamping,
                      min: 0,
                      max: 1,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volDamping',
                          v
                        ),
                    },
                    [`volTurbulence_${index}`]: {
                      label: 'Turbulence',
                      value: cfg.volTurbulence,
                      min: 0,
                      max: 3,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volTurbulence',
                          v
                        ),
                    },
                    [`volTurbulenceSpeed_${index}`]: {
                      label: 'Turbulence Speed',
                      value: cfg.volTurbulenceSpeed,
                      min: 0,
                      max: 2,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volTurbulenceSpeed',
                          v
                        ),
                    },
                    [`volMaxDrift_${index}`]: {
                      label: 'Max Drift',
                      value: cfg.volMaxDrift,
                      min: 0.5,
                      max: 20,
                      step: 0.5,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volMaxDrift',
                          v
                        ),
                    },
                    [`volGrowth_${index}`]: {
                      label: 'Growth',
                      value: cfg.volGrowth,
                      min: 0,
                      max: 10,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volGrowth',
                          v
                        ),
                    },
                    [`volFadeExp_${index}`]: {
                      label: 'Fade Exponent',
                      value: cfg.volFadeExp,
                      min: 0.1,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volFadeExp',
                          v
                        ),
                    },
                    [`volBuoyancy_${index}`]: {
                      label: 'Buoyancy',
                      value: cfg.volBuoyancy,
                      min: -5,
                      max: 5,
                      step: 0.1,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volBuoyancy',
                          v
                        ),
                    },
                    [`volBlendMode_${index}`]: {
                      label: 'Blend Mode',
                      value: cfg.volBlendMode,
                      options: [
                        'Normal',
                        'Additive',
                        'Subtractive',
                        'Multiply',
                      ],
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'volBlendMode',
                          v
                        ),
                    },
                  },
                  { collapsed: true }
                ),
                [`Config ${index}`]: folder(
                  {
                    [`visible_${index}`]: {
                      label: 'Visible',
                      value: cfg.visible,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'visible',
                          v
                        ),
                    },
                    [`tension_${index}`]: {
                      label: 'Tension',
                      value: cfg.tension,
                      min: 0,
                      max: 1,
                      step: 0.01,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'tension',
                          v
                        ),
                    },
                    [`closed_${index}`]: {
                      label: 'Closed Loop',
                      value: cfg.closed,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'closed',
                          v
                        ),
                    },
                    [`arcSegments_${index}`]: {
                      label: 'Arc Segments',
                      value: cfg.arcSegments,
                      min: 10,
                      max: 500,
                      step: 10,
                      onChange: (v) =>
                        updateSplineConfig(
                          setSplineConfigs,
                          index,
                          'arcSegments',
                          v
                        ),
                    },
                  },
                  { collapsed: true }
                ),
                [`Actions ${index}`]: folder(
                  {
                    [`cloneSpline_${index}`]: button(
                      () => {
                        setSplines((prev) => {
                          const cloned = prev[index].map((pt) => ({
                            position: pt.position.clone(),
                            rotation: pt.rotation
                              ? pt.rotation.clone()
                              : new THREE.Euler(),
                            scale: pt.scale
                              ? pt.scale.clone()
                              : new THREE.Vector3(1, 1, 1),
                          }));
                          return [...prev, cloned];
                        });
                        setSplineConfigs((prev) => [
                          ...prev,
                          {
                            ...(prev[index] ?? DEFAULT_SPLINE_CONFIG),
                            name: `${(prev[index] ?? DEFAULT_SPLINE_CONFIG).name || `Spline ${index + 1}`} Copy`,
                          },
                        ]);
                      },
                      { label: 'Clone Spline' }
                    ),
                    [`removeSpline_${index}`]: button(
                      () => {
                        setSplines((prev) =>
                          prev.length > 1
                            ? prev.filter((_el, i) => i !== index)
                            : prev
                        );
                        setSplineConfigs((prev) =>
                          prev.length > 1
                            ? prev.filter((_el, i) => i !== index)
                            : prev
                        );
                      },
                      { label: 'Remove Spline' }
                    ),
                    [`addPoint_${index}`]: button(
                      () => {
                        setSplines((prev) =>
                          prev.map((pts, i) => {
                            if (i !== index) return pts;
                            const lastPos =
                              pts[pts.length - 1]?.position ??
                              new THREE.Vector3(0, 0, 0);
                            return [
                              ...pts,
                              {
                                position: new THREE.Vector3(
                                  lastPos.x + (Math.random() - 0.5) * 0.5,
                                  lastPos.y + (Math.random() - 0.5) * 0.5,
                                  lastPos.z + (Math.random() - 0.5) * 0.5
                                ),
                                rotation: new THREE.Euler(),
                                scale: new THREE.Vector3(1, 1, 1),
                              },
                            ];
                          })
                        );
                      },
                      { label: 'Add Point' }
                    ),
                    [`removePoint_${index}`]: button(
                      () => {
                        setSplines((prev) =>
                          prev.map((pts, i) => {
                            if (i !== index) return pts;
                            return pts.length > 2 ? pts.slice(0, -1) : pts;
                          })
                        );
                      },
                      { label: 'Remove Last Point' }
                    ),
                  },
                  { collapsed: true }
                ),
              },
              { collapsed: true }
            );
            return acc;
          }, {}),
        },
        { collapsed: true }
      ),

      Attractor: folder(
        {
          cursorAttractorEnabled: {
            label: 'Enabled',
            value: D.cursorAttractorEnabled ?? false,
          },
          showCursorAttractor: {
            label: 'Show Helper',
            value: D.showCursorAttractor ?? false,
          },
          cursorAttractorMode: {
            label: 'Mode',
            value: D.cursorAttractorMode ?? 'attractor',
            options: ['attractor', 'repeller'],
          },
          cursorAttractorStrength: {
            label: 'Strength',
            value: D.cursorAttractorStrength ?? 3,
            min: 0,
            max: 50,
            step: 0.5,
          },
          cursorAttractorRadius: {
            label: 'Radius',
            value: D.cursorAttractorRadius ?? 3,
            min: 0.1,
            max: 20,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),

      Water: folder(
        {
          waterVisible: {
            label: 'Visible',
            value: D.waterVisible,
          },
          Dimensions: folder(
            {
              waterWidth: {
                label: 'Width',
                value: D.waterWidth,
                min: 0.5,
                max: 20,
                step: 0.1,
              },
              waterDepth: {
                label: 'Depth',
                value: D.waterDepth,
                min: 0.5,
                max: 20,
                step: 0.1,
              },
              waterHeight: {
                label: 'Height',
                value: D.waterHeight,
                min: 0.5,
                max: 20,
                step: 0.1,
              },
              waterSegments: {
                label: 'Segments',
                value: D.waterSegments,
                min: 4,
                max: 64,
                step: 1,
              },
            },
            { collapsed: true }
          ),
          waterTopColor: { label: 'Top Color', value: D.waterTopColor },
          waterBottomColor: {
            label: 'Bottom Color',
            value: D.waterBottomColor,
          },
          waterOpacity: {
            label: 'Opacity',
            value: D.waterOpacity,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waterTransmission: {
            label: 'Transmission',
            value: D.waterTransmission,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waterRoughness: {
            label: 'Roughness',
            value: D.waterRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waterIor: {
            label: 'IOR',
            value: D.waterIor,
            min: 1,
            max: 2.5,
            step: 0.01,
          },
          waterThickness: {
            label: 'Thickness',
            value: D.waterThickness,
            min: 0,
            max: 5,
            step: 0.05,
          },
          Waves: folder(
            {
              waveHeight: {
                label: 'Height',
                value: D.waveHeight,
                min: 0,
                max: 0.5,
                step: 0.005,
              },
              waveChoppiness: {
                label: 'Choppiness',
                value: D.waveChoppiness,
                min: 0,
                max: 2,
                step: 0.01,
              },
              waveSpeed: {
                label: 'Speed',
                value: D.waveSpeed,
                min: 0,
                max: 2,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Interaction: folder(
            {
              interactionEnabled: {
                label: 'Cursor Ripple',
                value: D.interactionEnabled,
              },
              interactionRadius: {
                label: 'Radius',
                value: D.interactionRadius,
                min: 0.05,
                max: 1,
                step: 0.01,
              },
              interactionDepth: {
                label: 'Depth',
                value: D.interactionDepth,
                min: 0.001,
                max: 0.05,
                step: 0.001,
              },
              interactionViscosity: {
                label: 'Viscosity',
                value: D.interactionViscosity,
                min: 0.85,
                max: 0.99,
                step: 0.001,
              },
              interactionResolution: {
                label: 'Resolution',
                value: D.interactionResolution,
                min: 32,
                max: 192,
                step: 32,
              },
            },
            { collapsed: true }
          ),
          Edges: folder(
            {
              waterShowEdges: {
                label: 'Show Edges',
                value: D.waterShowEdges,
              },
              waterEdgeColor: {
                label: 'Edge Color',
                value: D.waterEdgeColor,
              },
              waterEdgeOpacity: {
                label: 'Edge Opacity',
                value: D.waterEdgeOpacity,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Seafloor: folder(
        {
          seafloorVisible: {
            label: 'Visible',
            value: D.seafloorVisible,
          },
          seafloorColor: {
            label: 'Color',
            value: D.seafloorColor,
          },
          bumpHeight: {
            label: 'Bump Height',
            value: D.bumpHeight,
            min: 0,
            max: 0.3,
            step: 0.005,
          },
          bumpFrequency: {
            label: 'Bump Frequency',
            value: D.bumpFrequency,
            min: 0.1,
            max: 4,
            step: 0.05,
          },
          bumpDetail: {
            label: 'Bump Detail',
            value: D.bumpDetail,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      'Post Processing': folder(
        {
          bloomEnabled: {
            label: 'Bloom',
            value: D.bloomEnabled,
          },
          bloomIntensity: {
            label: 'Intensity',
            value: D.bloomIntensity,
            min: 0,
            max: 6,
            step: 0.01,
          },
          bloomRadius: {
            label: 'Radius',
            value: D.bloomRadius,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    // Rebuild per-spline folders when count changes
    [splines.length, splineConfigs]
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  // Keep configs array in sync with spline count
  useEffect(() => {
    setSplineConfigs((prev) => {
      if (prev.length === splines.length) return prev;
      return splines.map((_, i) => prev[i] ?? { ...DEFAULT_SPLINE_CONFIG });
    });
  }, [splines.length]);

  return useMemo(
    () => ({
      ...controls,
      splineConfigs,
    }),
    [controls, splineConfigs]
  );
}
