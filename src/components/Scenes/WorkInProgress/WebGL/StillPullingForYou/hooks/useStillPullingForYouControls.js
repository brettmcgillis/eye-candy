import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import { SCENE_PRESETS } from '../presets/presets';

const SCENE_PRESET_NAMES = Object.keys(SCENE_PRESETS);
const DEFAULT_SCENE_PRESET = SCENE_PRESET_NAMES[0];
const D = SCENE_PRESETS[DEFAULT_SCENE_PRESET];

const DEFAULT_SPLINE_CONFIG = {
  name: '',
  type: 'Particle',
  visible: true,
  tension: 0.6,
  closed: false,
  arcSegments: 200,
  // Particle Smoke
  particleCount: 3000,
  particleSize: 25,
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
  // Volumetric Smoke
  volParticleCount: 3000,
  volSize: 30,
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

function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

export { DEFAULT_SPLINE_CONFIG };

export default function useStillPullingForYouControls(
  splines,
  setSplines,
  initialSplineConfigs
) {
  const controlsSnapshotRef = useRef({ ...D });
  const selectedScenePresetRef = useRef(DEFAULT_SCENE_PRESET);
  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineConfigs, setSplineConfigs] = useState(
    () =>
      initialSplineConfigs || splines.map(() => ({ ...DEFAULT_SPLINE_CONFIG }))
  );

  // Ref-based helper so button closures can call it safely.
  const safeApplyRef = useRef(null);

  const [controls, setControls] = useControls(
    'Still Pulling For You',
    () => ({
      'Scene Presets': folder(
        {
          scenePreset: {
            label: 'Preset',
            value: DEFAULT_SCENE_PRESET,
            options: SCENE_PRESET_NAMES,
          },
          resetScene: button(() => {
            const values = SCENE_PRESETS[selectedScenePresetRef.current] || D;
            safeApplyRef.current(values);
          }),
          ...(localEnv()
            ? {
                copyScene: button(
                  () => {
                    const json = JSON.stringify(
                      controlsSnapshotRef.current,
                      null,
                      2
                    );
                    const literal = json.replace(
                      /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
                      '$1:'
                    );
                    navigator.clipboard.writeText(literal);
                  },
                  { label: 'Copy Scene Preset' }
                ),
              }
            : {}),
        },
        { collapsed: true }
      ),

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
                        .filter(([k]) => k !== 'name')
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
                [`type_${index}`]: {
                  label: 'Type',
                  value: cfg.type ?? 'Particle',
                  options: ['Particle', 'Volumetric'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'type', v),
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
                      min: 1,
                      max: 100,
                      step: 1,
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
                      min: 1,
                      max: 200,
                      step: 1,
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

      Water: folder(
        {
          waterVisible: {
            label: 'Visible',
            value: D.waterVisible,
          },
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
          waterRoughness: {
            label: 'Roughness',
            value: D.waterRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waveHeight: {
            label: 'Wave Height',
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
            label: 'Wave Speed',
            value: D.waveSpeed,
            min: 0,
            max: 2,
            step: 0.01,
          },
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
    }),
    // Rebuild per-spline folders when count changes
    [splines.length, splineConfigs]
  );

  controlsSnapshotRef.current = { ...controls };

  // Populate the ref now that setControls is available
  safeApplyRef.current = (values) => {
    const known = Object.keys(controlsSnapshotRef.current);
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([k]) => known.includes(k))
    );
    setControls(filtered);
  };

  // Apply scene preset when selection changes
  const prevScenePresetRef = useRef(controls.scenePreset);
  useEffect(() => {
    if (controls.scenePreset === prevScenePresetRef.current) return;
    prevScenePresetRef.current = controls.scenePreset;
    selectedScenePresetRef.current = controls.scenePreset;
    const values = SCENE_PRESETS[controls.scenePreset];
    if (values) safeApplyRef.current(values);
  }, [controls, setControls]);

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
