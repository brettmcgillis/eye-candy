import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../utils/appUtils';
import SPLINE_PRESETS from '../../../../elements/spline/splinePresets';

const MAX_ATTRACTORS = 8;

export default function useSmokeTestControls(points, setPoints, attractorsRef) {
  const selectedPresetRef = useRef('Default');
  const controlsSnapshotRef = useRef({});
  const [attractorVersion, setAttractorVersion] = useState(0);
  const forceAttractorUpdate = useCallback(
    () => setAttractorVersion((c) => c + 1),
    []
  );

  const [
    {
      preset,
      tension,
      closed,
      showSpline,
      showHelpers,
      arcSegments,
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
  ] = useControls('Smoke Test', () => ({
    Presets: folder(
      {
        preset: {
          label: 'Preset',
          value: 'Default',
          options: Object.keys(SPLINE_PRESETS),
        },
        reset: button(() => {
          const p = SPLINE_PRESETS[selectedPresetRef.current];
          if (p) setPoints(p.points.map((v) => v.clone()));
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

    Spline: folder(
      {
        tension: {
          label: 'Tension',
          value: 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        closed: {
          label: 'Closed Loop',
          value: true,
        },
        showSpline: {
          label: 'Show Spline',
          value: true,
        },
        showHelpers: {
          label: 'Show Helpers',
          value: true,
        },
        arcSegments: {
          label: 'Arc Segments',
          value: 200,
          min: 10,
          max: 500,
          step: 10,
        },
        addPoint: button(
          () => {
            setPoints((prev) => {
              const last = prev[prev.length - 1] ?? new THREE.Vector3(0, 0, 0);
              // GridBox spans Y: -200 to 1800 — use inner bounds with margin
              const Y_MIN = -150;
              const Y_MAX = 1750;
              let newY = last.y + (Math.random() - 0.5) * 200;
              if (newY > Y_MAX) newY = 2 * Y_MAX - newY;
              if (newY < Y_MIN) newY = 2 * Y_MIN - newY;
              return [
                ...prev,
                new THREE.Vector3(
                  last.x + (Math.random() - 0.5) * 200,
                  newY,
                  last.z + (Math.random() - 0.5) * 200
                ),
              ];
            });
          },
          { label: 'Add Point' }
        ),
        removeLast: button(
          () => {
            setPoints((prev) => (prev.length > 2 ? prev.slice(0, -1) : prev));
          },
          { label: 'Remove Last' }
        ),
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
  }));

  // Track selected preset name
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Apply preset points when selection changes
  useEffect(() => {
    const p = SPLINE_PRESETS[preset];
    if (p) setPoints(p.points.map((v) => v.clone()));
  }, [preset]);

  // Keep snapshot ref current for the copy button
  useEffect(() => {
    controlsSnapshotRef.current = {
      tension,
      closed,
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
      points: points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    };
  });

  return useMemo(
    () => ({
      tension,
      closed,
      showSpline,
      showHelpers,
      arcSegments,
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
    }),
    [
      tension,
      closed,
      showSpline,
      showHelpers,
      arcSegments,
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
    ]
  );
}
