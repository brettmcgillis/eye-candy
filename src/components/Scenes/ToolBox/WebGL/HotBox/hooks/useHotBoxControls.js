import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import HOTBOX_PRESETS from '../presets/presets';

const MAX_ATTRACTORS = 8;

const DEFAULT_SPLINE_CONFIG = {
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
  // Particle smoke defaults
  particleCount: 15000,
  particleSize: 40,
  particleColor: '#7c7989',
  opacity: 0.045,
  growth: 2.0,
  fadeExponent: 1.2,
  buoyancy: 20,
  rotSpeed: 0.3,
  blendMode: 'Normal',
  springK: 5,
  flowSpeed: 0.04,
  damping: 0.12,
  turbulence: 120,
  turbulenceSpeed: 0.3,
  spawnSpread: 120,
  maxDrift: 600,
  fadeRate: 8,
  // Volumetric smoke defaults
  volParticleCount: 12000,
  volSize: 60,
  volColor: '#9090a0',
  volOpacity: 0.06,
  volBlendMode: 'Normal',
  volSpread: 120,
  volSpringK: 2.5,
  volDamping: 0.1,
  volTurbulence: 180,
  volTurbulenceSpeed: 0.25,
  volMaxDrift: 900,
  volGrowth: 1.5,
  volFadeExp: 1.2,
  volBuoyancy: 0,
  // Volumetric fire defaults
  fireWidth: 80,
  fireHeight: 200,
  fireDepth: 80,
  fireSliceSpacing: 4,
  fireMagnitude: 1.3,
  fireLacunarity: 2.0,
  fireGain: 0.5,
  fireTintColor: '#ffffff',
  fireSaturation: 1.0,
  fireBrightness: 1.5,
  fireAnimated: true,
  fireAnimSpeed: 0.5,
  // Curve fire defaults
  fire2AutoRotate: true,
  fire2AutoTaper: true,
  fire2TaperAmount: 0.25,
  fire2ShowCurve: false,
};

function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

function applyPreset(presetName, setSplines, setSplineConfigs) {
  const p = HOTBOX_PRESETS[presetName];
  if (!p) return;
  setSplines(
    p.splines.map((s) =>
      s.points.map((pt) => ({
        position: pt.position.clone(),
        rotation: pt.rotation.clone(),
        scale: pt.scale ? pt.scale.clone() : new THREE.Vector3(1, 1, 1),
      }))
    )
  );
  setSplineConfigs(
    p.splines.map((s) => ({
      ...DEFAULT_SPLINE_CONFIG,
      type: s.type ?? 'Smoke',
      smokeType: s.smokeType ?? 'Particle',
      fireType: s.fireType ?? 'Classic',
      tension: s.tension ?? DEFAULT_SPLINE_CONFIG.tension,
      closed: s.closed ?? DEFAULT_SPLINE_CONFIG.closed,
      ...(s.type === 'Fire' ? { closed: s.closed ?? false } : {}),
    }))
  );
}

export default function useHotBoxControls(splines, setSplines, attractorsRef) {
  const selectedPresetRef = useRef('Default');
  const controlsSnapshotRef = useRef({});
  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineConfigs, setSplineConfigs] = useState(() => {
    const p = HOTBOX_PRESETS.Default;
    return p.splines.map((s) => ({
      ...DEFAULT_SPLINE_CONFIG,
      type: s.type ?? 'Smoke',
      smokeType: s.smokeType ?? 'Particle',
      fireType: s.fireType ?? 'Classic',
      tension: s.tension ?? DEFAULT_SPLINE_CONFIG.tension,
      closed: s.closed ?? DEFAULT_SPLINE_CONFIG.closed,
    }));
  });
  const [attractorVersion, setAttractorVersion] = useState(0);
  const forceAttractorUpdate = useCallback(
    () => setAttractorVersion((c) => c + 1),
    []
  );

  const [
    {
      preset,
      pointMode,
      bgColor,
      showSmokeVolume,
      showFireVolume,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
    },
  ] = useControls(
    'Hot Box',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: 'Default',
            options: Object.keys(HOTBOX_PRESETS),
          },
          reset: button(() => {
            applyPreset(
              selectedPresetRef.current,
              setSplines,
              setSplineConfigs
            );
          }),
          ...(localEnv()
            ? {
                copy: button(
                  () => {
                    const str = JSON.stringify(
                      controlsSnapshotRef.current,
                      null,
                      2
                    ).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)"\s*:/g, '$1:');
                    navigator.clipboard.writeText(str);
                  },
                  { label: 'Copy Preset' }
                ),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          pointMode: {
            label: 'Point Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'scale'],
          },
          bgColor: {
            label: 'Background',
            value: '#1a1a2e',
          },
          showSmokeVolume: {
            label: 'Smoke Volume',
            value: false,
          },
          showFireVolume: {
            label: 'Fire Volume',
            value: false,
          },
        },
        { collapsed: true }
      ),

      Attractors: folder(
        {
          showAttractors: {
            label: 'Show Helpers',
            value: true,
          },
          attractorMode: {
            label: 'Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'none'],
          },
          attractorStrength: {
            label: 'Strength',
            value: 300,
            min: 0,
            max: 5000,
            step: 50,
          },
          attractorRadius: {
            label: 'Radius',
            value: 300,
            min: 10,
            max: 1000,
            step: 10,
          },
          addAttractor: button(() => {
            if (attractorsRef.current.length >= MAX_ATTRACTORS) return;
            attractorsRef.current.push({
              position: [
                (Math.random() - 0.5) * 600,
                100 + Math.random() * 500,
                (Math.random() - 0.5) * 400,
              ],
              direction: [0, 1, 0],
              rotation: [0, 0, 0],
            });
            setAttractorVersion((c) => c + 1);
          }),
          removeAttractor: button(() => {
            if (attractorsRef.current.length <= 0) return;
            attractorsRef.current.pop();
            setAttractorVersion((c) => c + 1);
          }),
          removeAll: button(() => {
            // eslint-disable-next-line no-param-reassign
            attractorsRef.current.length = 0;
            setAttractorVersion((c) => c + 1);
          }),
        },
        { collapsed: true }
      ),

      Actions: folder(
        {
          addSpline: button(
            () => {
              const randPt = () => ({
                position: new THREE.Vector3(
                  (Math.random() - 0.5) * 400,
                  100 + Math.random() * 400,
                  (Math.random() - 0.5) * 400
                ),
                rotation: new THREE.Euler(),
                scale: new THREE.Vector3(1, 1, 1),
              });
              setSplines((prev) => [...prev, [randPt(), randPt(), randPt()]]);
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
                    return `    { position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}), rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}), scale: new THREE.Vector3(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}) }`;
                  });
                  const nameStr = cfg.name ? `\n    name: '${cfg.name}',` : '';
                  return `  {${nameStr}\n    type: '${cfg.type}',\n    smokeType: '${cfg.smokeType}',\n    fireType: '${cfg.fireType}',\n    tension: ${cfg.tension},\n    closed: ${cfg.closed},\n    points: [\n${pointStrs.join(',\n')}\n    ]\n  }`;
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
            [`Config ${index}`]: folder(
              {
                [`visible_${index}`]: {
                  label: 'Visible',
                  value: cfg.visible,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'visible', v),
                },
                [`type_${index}`]: {
                  label: 'Type',
                  value: cfg.type ?? 'Smoke',
                  options: ['Fire', 'Smoke'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'type', v),
                },
                [`smokeType_${index}`]: {
                  label: 'Smoke Rendering',
                  value: cfg.smokeType ?? 'Particle',
                  options: ['Volumetric', 'Particle'],
                  render: (get) =>
                    get(
                      `Hot Box.Spline ${index + 1}.Config ${index}.type_${index}`
                    ) === 'Smoke',
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'smokeType', v),
                },
                [`fireType_${index}`]: {
                  label: 'Fire Rendering',
                  value: cfg.fireType ?? 'Classic',
                  options: ['Classic', 'Curve', 'Both'],
                  render: (get) =>
                    get(
                      `Hot Box.Spline ${index + 1}.Config ${index}.type_${index}`
                    ) === 'Fire',
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fireType', v),
                },
                [`tension_${index}`]: {
                  label: 'Tension',
                  value: cfg.tension,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'tension', v),
                },
                [`closed_${index}`]: {
                  label: 'Closed Loop',
                  value: cfg.closed,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'closed', v),
                },
                [`showSpline_${index}`]: {
                  label: 'Show Spline',
                  value: cfg.showSpline,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'showSpline',
                      v
                    ),
                },
                [`showHelpers_${index}`]: {
                  label: 'Show Helpers',
                  value: cfg.showHelpers,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'showHelpers',
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
            [`Particle Smoke ${index}`]: folder(
              {
                [`particleCount_${index}`]: {
                  label: 'Particle Count',
                  value: cfg.particleCount ?? 15000,
                  min: 500,
                  max: 40000,
                  step: 500,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'particleCount',
                      v
                    ),
                },
                [`particleSize_${index}`]: {
                  label: 'Particle Size',
                  value: cfg.particleSize ?? 40,
                  min: 5,
                  max: 120,
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
                  value: cfg.particleColor ?? '#7c7989',
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
                  value: cfg.opacity ?? 0.045,
                  min: 0.005,
                  max: 1,
                  step: 0.005,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'opacity', v),
                },
                [`growth_${index}`]: {
                  label: 'Growth',
                  value: cfg.growth ?? 2.0,
                  min: 0,
                  max: 10,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'growth', v),
                },
                [`fadeExponent_${index}`]: {
                  label: 'Fade Exponent',
                  value: cfg.fadeExponent ?? 1.2,
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
                [`buoyancy_${index}`]: {
                  label: 'Buoyancy',
                  value: cfg.buoyancy ?? 20,
                  min: -200,
                  max: 200,
                  step: 5,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'buoyancy', v),
                },
                [`rotSpeed_${index}`]: {
                  label: 'Rotation Speed',
                  value: cfg.rotSpeed ?? 0.3,
                  min: 0,
                  max: 5,
                  step: 0.05,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'rotSpeed', v),
                },
                [`blendMode_${index}`]: {
                  label: 'Blend Mode',
                  value: cfg.blendMode ?? 'Normal',
                  options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'blendMode', v),
                },
                [`springK_${index}`]: {
                  label: 'Spring Strength',
                  value: cfg.springK ?? 5,
                  min: 0,
                  max: 40,
                  step: 0.5,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'springK', v),
                },
                [`flowSpeed_${index}`]: {
                  label: 'Flow Speed',
                  value: cfg.flowSpeed ?? 0.04,
                  min: 0,
                  max: 0.5,
                  step: 0.005,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'flowSpeed', v),
                },
                [`damping_${index}`]: {
                  label: 'Damping /sec',
                  value: cfg.damping ?? 0.12,
                  min: 0.001,
                  max: 1,
                  step: 0.005,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'damping', v),
                },
                [`turbulence_${index}`]: {
                  label: 'Turbulence',
                  value: cfg.turbulence ?? 120,
                  min: 0,
                  max: 800,
                  step: 10,
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
                  value: cfg.turbulenceSpeed ?? 0.3,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'turbulenceSpeed',
                      v
                    ),
                },
                [`spawnSpread_${index}`]: {
                  label: 'Spawn Spread',
                  value: cfg.spawnSpread ?? 120,
                  min: 0,
                  max: 400,
                  step: 5,
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
                  value: cfg.maxDrift ?? 600,
                  min: 50,
                  max: 2000,
                  step: 50,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'maxDrift', v),
                },
                [`fadeRate_${index}`]: {
                  label: 'Fade Rate',
                  value: cfg.fadeRate ?? 8,
                  min: 1,
                  max: 50,
                  step: 1,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fadeRate', v),
                },
              },
              { collapsed: true }
            ),
            [`Volumetric Smoke ${index}`]: folder(
              {
                [`volParticleCount_${index}`]: {
                  label: 'Particle Count',
                  value: cfg.volParticleCount ?? 12000,
                  min: 500,
                  max: 40000,
                  step: 500,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'volParticleCount',
                      v
                    ),
                },
                [`volSize_${index}`]: {
                  label: 'Particle Size',
                  value: cfg.volSize ?? 60,
                  min: 5,
                  max: 200,
                  step: 1,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'volSize', v),
                },
                [`volColor_${index}`]: {
                  label: 'Color',
                  value: cfg.volColor ?? '#9090a0',
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'volColor', v),
                },
                [`volOpacity_${index}`]: {
                  label: 'Opacity',
                  value: cfg.volOpacity ?? 0.06,
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
                [`volBlendMode_${index}`]: {
                  label: 'Blend Mode',
                  value: cfg.volBlendMode ?? 'Normal',
                  options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'volBlendMode',
                      v
                    ),
                },
                [`volSpread_${index}`]: {
                  label: 'Spawn Spread',
                  value: cfg.volSpread ?? 120,
                  min: 0,
                  max: 600,
                  step: 5,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'volSpread', v),
                },
                [`volSpringK_${index}`]: {
                  label: 'Spring Strength',
                  value: cfg.volSpringK ?? 2.5,
                  min: 0,
                  max: 40,
                  step: 0.5,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'volSpringK',
                      v
                    ),
                },
                [`volDamping_${index}`]: {
                  label: 'Damping /sec',
                  value: cfg.volDamping ?? 0.1,
                  min: 0.001,
                  max: 1,
                  step: 0.005,
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
                  value: cfg.volTurbulence ?? 180,
                  min: 0,
                  max: 800,
                  step: 10,
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
                  value: cfg.volTurbulenceSpeed ?? 0.25,
                  min: 0,
                  max: 3,
                  step: 0.05,
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
                  value: cfg.volMaxDrift ?? 900,
                  min: 50,
                  max: 2000,
                  step: 50,
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
                  value: cfg.volGrowth ?? 1.5,
                  min: 0,
                  max: 10,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'volGrowth', v),
                },
                [`volFadeExp_${index}`]: {
                  label: 'Fade Exponent',
                  value: cfg.volFadeExp ?? 1.2,
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
                  value: cfg.volBuoyancy ?? 0,
                  min: -200,
                  max: 200,
                  step: 5,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'volBuoyancy',
                      v
                    ),
                },
              },
              { collapsed: true }
            ),
            [`Volumetric Fire ${index}`]: folder(
              {
                [`fireWidth_${index}`]: {
                  label: 'Width',
                  value: cfg.fireWidth ?? 80,
                  min: 10,
                  max: 400,
                  step: 5,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fireWidth', v),
                },
                [`fireHeight_${index}`]: {
                  label: 'Height',
                  value: cfg.fireHeight ?? 200,
                  min: 20,
                  max: 800,
                  step: 10,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireHeight',
                      v
                    ),
                },
                [`fireDepth_${index}`]: {
                  label: 'Depth',
                  value: cfg.fireDepth ?? 80,
                  min: 10,
                  max: 400,
                  step: 5,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fireDepth', v),
                },
                [`fireSliceSpacing_${index}`]: {
                  label: 'Slice Spacing',
                  value: cfg.fireSliceSpacing ?? 4,
                  min: 1,
                  max: 20,
                  step: 0.5,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireSliceSpacing',
                      v
                    ),
                },
                [`fireMagnitude_${index}`]: {
                  label: 'Magnitude',
                  value: cfg.fireMagnitude ?? 1.3,
                  min: 0.1,
                  max: 5,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireMagnitude',
                      v
                    ),
                },
                [`fireLacunarity_${index}`]: {
                  label: 'Lacunarity',
                  value: cfg.fireLacunarity ?? 2.0,
                  min: 1,
                  max: 5,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireLacunarity',
                      v
                    ),
                },
                [`fireGain_${index}`]: {
                  label: 'Gain',
                  value: cfg.fireGain ?? 0.5,
                  min: 0.01,
                  max: 1,
                  step: 0.01,
                  onChange: (v) =>
                    updateSplineConfig(setSplineConfigs, index, 'fireGain', v),
                },
                [`fireTintColor_${index}`]: {
                  label: 'Tint',
                  value: cfg.fireTintColor ?? '#ffffff',
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireTintColor',
                      v
                    ),
                },
                [`fireSaturation_${index}`]: {
                  label: 'Saturation',
                  value: cfg.fireSaturation ?? 1.0,
                  min: 0,
                  max: 3,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireSaturation',
                      v
                    ),
                },
                [`fireBrightness_${index}`]: {
                  label: 'Brightness',
                  value: cfg.fireBrightness ?? 1.5,
                  min: 0,
                  max: 5,
                  step: 0.1,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireBrightness',
                      v
                    ),
                },
                [`fireAnimated_${index}`]: {
                  label: 'Animated',
                  value: cfg.fireAnimated ?? true,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireAnimated',
                      v
                    ),
                },
                [`fireAnimSpeed_${index}`]: {
                  label: 'Anim Speed',
                  value: cfg.fireAnimSpeed ?? 0.5,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fireAnimSpeed',
                      v
                    ),
                },
              },
              { collapsed: true }
            ),
            [`Curve Fire ${index}`]: folder(
              {
                [`fire2AutoRotate_${index}`]: {
                  label: 'Auto Rotate',
                  value: cfg.fire2AutoRotate ?? true,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fire2AutoRotate',
                      v
                    ),
                },
                [`fire2AutoTaper_${index}`]: {
                  label: 'Auto Taper',
                  value: cfg.fire2AutoTaper ?? true,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fire2AutoTaper',
                      v
                    ),
                },
                [`fire2TaperAmount_${index}`]: {
                  label: 'Taper Amount',
                  value: cfg.fire2TaperAmount ?? 0.25,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fire2TaperAmount',
                      v
                    ),
                },
                [`fire2ShowCurve_${index}`]: {
                  label: 'Show Curve',
                  value: cfg.fire2ShowCurve ?? false,
                  onChange: (v) =>
                    updateSplineConfig(
                      setSplineConfigs,
                      index,
                      'fire2ShowCurve',
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
                        const Y_MIN = -150;
                        const Y_MAX = 1750;
                        let newY = lastPos.y + (Math.random() - 0.5) * 200;
                        if (newY > Y_MAX) newY = 2 * Y_MAX - newY;
                        if (newY < Y_MIN) newY = 2 * Y_MIN - newY;
                        return [
                          ...pts,
                          {
                            position: new THREE.Vector3(
                              lastPos.x + (Math.random() - 0.5) * 200,
                              newY,
                              lastPos.z + (Math.random() - 0.5) * 200
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
    }),
    [splines.length]
  );

  // Track selected preset name
  const isInitialMount = useRef(true);
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Apply preset points when selection changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    applyPreset(preset, setSplines, setSplineConfigs);
  }, [preset]);

  // Keep configs array in sync with spline count
  useEffect(() => {
    setSplineConfigs((prev) => {
      if (prev.length === splines.length) return prev;
      return splines.map((_, i) => prev[i] ?? { ...DEFAULT_SPLINE_CONFIG });
    });
  }, [splines.length]);

  // Keep snapshot ref current for the copy button
  useEffect(() => {
    controlsSnapshotRef.current = {
      attractorStrength,
      attractorRadius,
      showSmokeVolume,
      showFireVolume,
      bgColor,
      splines: splines.map((pts, i) => ({
        ...(splineConfigs[i] ?? DEFAULT_SPLINE_CONFIG),
        points: pts.map((pt) => ({
          x: pt.position.x,
          y: pt.position.y,
          z: pt.position.z,
          rotation: (pt.rotation ?? new THREE.Euler()).toArray().slice(0, 3),
          scale: [pt.scale?.x ?? 1, pt.scale?.y ?? 1, pt.scale?.z ?? 1],
        })),
      })),
    };
  });

  return useMemo(
    () => ({
      pointMode,
      showSmokeVolume,
      showFireVolume,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
    }),
    [
      pointMode,
      showSmokeVolume,
      showFireVolume,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
    ]
  );
}
