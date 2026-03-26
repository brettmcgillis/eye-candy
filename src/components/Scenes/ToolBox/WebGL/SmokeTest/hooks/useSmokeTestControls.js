import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import SPLINE_PRESETS from '../../../../../elements/spline/splinePresets';

const MAX_ATTRACTORS = 8;

const DEFAULT_SPLINE_CONFIG = {
  visible: true,
  tension: 1,
  closed: true,
  showSpline: true,
  showHelpers: true,
  arcSegments: 200,
};

function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

export default function useSmokeTestControls(
  splines,
  setSplines,
  attractorsRef
) {
  const selectedPresetRef = useRef('Default');
  const controlsSnapshotRef = useRef({});
  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineConfigs, setSplineConfigs] = useState(() =>
    splines.map(() => ({ ...DEFAULT_SPLINE_CONFIG }))
  );
  const [attractorVersion, setAttractorVersion] = useState(0);
  const forceAttractorUpdate = useCallback(
    () => setAttractorVersion((c) => c + 1),
    []
  );

  const [
    {
      preset,
      pointMode,
      showClassicSmoke,
      showVolSmoke,
      bgColor,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      blendMode,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      volParticleCount,
      volSize,
      volColor,
      volOpacity,
      volBlendMode,
      volSpread,
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volMaxDrift,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
    },
  ] = useControls(
    'Smoke Test',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: 'Default',
            options: Object.keys(SPLINE_PRESETS),
          },
          reset: button(() => {
            const p = SPLINE_PRESETS[selectedPresetRef.current];
            if (p) {
              setSplines([
                p.points.map((pt) => ({
                  position: pt.position.clone(),
                  rotation: pt.rotation.clone(),
                })),
              ]);
              setSplineConfigs([
                {
                  ...DEFAULT_SPLINE_CONFIG,
                  tension: p.tension ?? DEFAULT_SPLINE_CONFIG.tension,
                  closed: p.closed ?? DEFAULT_SPLINE_CONFIG.closed,
                },
              ]);
            }
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
            options: ['translate', 'rotate'],
          },
          showClassicSmoke: {
            label: 'Particle Smoke',
            value: true,
          },
          showVolSmoke: {
            label: 'Volumetric Smoke',
            value: true,
          },
          bgColor: {
            label: 'Background',
            value: '#ffffff',
          },
        },
        { collapsed: true }
      ),

      'Particle Smoke': folder(
        {
          particleCount: {
            label: 'Particle Count',
            value: 15000,
            min: 500,
            max: 40000,
            step: 500,
          },
          particleSize: {
            label: 'Particle Size',
            value: 40,
            min: 5,
            max: 120,
            step: 1,
          },
          particleColor: {
            label: 'Color',
            value: '#7c7989',
          },
          opacity: {
            label: 'Opacity',
            value: 0.045,
            min: 0.005,
            max: 1,
            step: 0.005,
          },
          growth: {
            label: 'Growth',
            value: 2.0,
            min: 0,
            max: 10,
            step: 0.1,
          },
          fadeExponent: {
            label: 'Fade Exponent',
            value: 1.2,
            min: 0.1,
            max: 5,
            step: 0.1,
          },
          buoyancy: {
            label: 'Buoyancy',
            value: 20,
            min: -200,
            max: 200,
            step: 5,
          },
          rotSpeed: {
            label: 'Rotation Speed',
            value: 0.3,
            min: 0,
            max: 5,
            step: 0.05,
          },
          blendMode: {
            label: 'Blend Mode',
            value: 'Normal',
            options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
          },
          springK: {
            label: 'Spring Strength',
            value: 5,
            min: 0,
            max: 40,
            step: 0.5,
          },
          flowSpeed: {
            label: 'Flow Speed',
            value: 0.04,
            min: 0,
            max: 0.5,
            step: 0.005,
          },
          damping: {
            label: 'Damping /sec',
            value: 0.12,
            min: 0.001,
            max: 1,
            step: 0.005,
          },
          turbulence: {
            label: 'Turbulence',
            value: 120,
            min: 0,
            max: 800,
            step: 10,
          },
          turbulenceSpeed: {
            label: 'Turbulence Speed',
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.05,
          },
          spawnSpread: {
            label: 'Spawn Spread',
            value: 120,
            min: 0,
            max: 400,
            step: 5,
          },
          maxDrift: {
            label: 'Max Drift',
            value: 600,
            min: 50,
            max: 2000,
            step: 50,
          },
          fadeRate: {
            label: 'Fade Rate',
            value: 8,
            min: 1,
            max: 50,
            step: 1,
            hint: 'Open loop only — how fast particles fade after the spline end',
          },
        },
        { collapsed: true }
      ),

      'Volumetric Smoke': folder(
        {
          volParticleCount: {
            label: 'Particle Count',
            value: 12000,
            min: 500,
            max: 40000,
            step: 500,
          },
          volSize: {
            label: 'Particle Size',
            value: 60,
            min: 5,
            max: 200,
            step: 1,
          },
          volColor: {
            label: 'Color',
            value: '#9090a0',
          },
          volOpacity: {
            label: 'Opacity',
            value: 0.06,
            min: 0.005,
            max: 1,
            step: 0.005,
          },
          volBlendMode: {
            label: 'Blend Mode',
            value: 'Normal',
            options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
          },
          volSpread: {
            label: 'Spawn Spread',
            value: 120,
            min: 0,
            max: 600,
            step: 5,
          },
          volSpringK: {
            label: 'Spring Strength',
            value: 2.5,
            min: 0,
            max: 40,
            step: 0.5,
          },
          volDamping: {
            label: 'Damping /sec',
            value: 0.1,
            min: 0.001,
            max: 1,
            step: 0.005,
          },
          volTurbulence: {
            label: 'Turbulence',
            value: 180,
            min: 0,
            max: 800,
            step: 10,
          },
          volTurbulenceSpeed: {
            label: 'Turbulence Speed',
            value: 0.25,
            min: 0,
            max: 3,
            step: 0.05,
          },
          volMaxDrift: {
            label: 'Max Drift',
            value: 900,
            min: 50,
            max: 2000,
            step: 50,
          },
          volGrowth: {
            label: 'Growth',
            value: 1.5,
            min: 0,
            max: 10,
            step: 0.1,
          },
          volFadeExp: {
            label: 'Fade Exponent',
            value: 1.2,
            min: 0.1,
            max: 5,
            step: 0.1,
          },
          volBuoyancy: {
            label: 'Buoyancy',
            value: 0,
            min: -200,
            max: 200,
            step: 5,
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
              });
              setSplines((prev) => [...prev, [randPt(), randPt(), randPt()]]);
            },
            { label: 'Add Spline' }
          ),
          removeSpline: button(
            () => {
              setSplines((prev) =>
                prev.length > 1 ? prev.slice(0, -1) : prev
              );
            },
            { label: 'Remove Spline' }
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
                    return `    { position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}), rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}) }`;
                  });
                  return `  {\n    tension: ${cfg.tension},\n    closed: ${cfg.closed},\n    points: [\n${pointStrs.join(',\n')}\n    ]\n  }`;
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
            [`visible_${index}`]: {
              label: 'Visible',
              value: cfg.visible,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'visible', v),
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
                updateSplineConfig(setSplineConfigs, index, 'showSpline', v),
            },
            [`showHelpers_${index}`]: {
              label: 'Show Helpers',
              value: cfg.showHelpers,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'showHelpers', v),
            },
            [`arcSegments_${index}`]: {
              label: 'Arc Segments',
              value: cfg.arcSegments,
              min: 10,
              max: 500,
              step: 10,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'arcSegments', v),
            },
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
        );
        return acc;
      }, {}),
    }),
    [splines.length]
  );

  // Track selected preset name
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Apply preset points when selection changes
  useEffect(() => {
    const p = SPLINE_PRESETS[preset];
    if (p) {
      setSplines([
        p.points.map((pt) => ({
          position: pt.position.clone(),
          rotation: pt.rotation.clone(),
        })),
      ]);
      setSplineConfigs([
        {
          ...DEFAULT_SPLINE_CONFIG,
          tension: p.tension ?? DEFAULT_SPLINE_CONFIG.tension,
          closed: p.closed ?? DEFAULT_SPLINE_CONFIG.closed,
        },
      ]);
    }
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
      particleCount,
      particleSize,
      particleColor,
      opacity,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      blendMode,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      attractorStrength,
      attractorRadius,
      volParticleCount,
      volSize,
      volColor,
      volOpacity,
      volBlendMode,
      volSpread,
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volMaxDrift,
      showClassicSmoke,
      showVolSmoke,
      bgColor,
      splines: splines.map((pts, i) => ({
        ...(splineConfigs[i] ?? DEFAULT_SPLINE_CONFIG),
        points: pts.map((pt) => ({
          x: pt.position.x,
          y: pt.position.y,
          z: pt.position.z,
          rotation: (pt.rotation ?? new THREE.Euler()).toArray().slice(0, 3),
        })),
      })),
    };
  });

  return useMemo(
    () => ({
      pointMode,
      showClassicSmoke,
      showVolSmoke,
      bgColor,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      blendMode,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      volParticleCount,
      volSize,
      volColor,
      volOpacity,
      volBlendMode,
      volSpread,
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volMaxDrift,
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
      showClassicSmoke,
      showVolSmoke,
      bgColor,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      growth,
      fadeExponent,
      buoyancy,
      rotSpeed,
      blendMode,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      fadeRate,
      volParticleCount,
      volSize,
      volColor,
      volOpacity,
      volBlendMode,
      volSpread,
      volSpringK,
      volDamping,
      volTurbulence,
      volTurbulenceSpeed,
      volMaxDrift,
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
