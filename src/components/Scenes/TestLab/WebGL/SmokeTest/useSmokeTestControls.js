import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useMemo } from 'react';

import { localEnv } from '../../../../../utils/appUtils';
import SPLINE_PRESETS from '../../../ToolBox/WebGL/SplineEditor/presets/presets';

export default function useSmokeTestControls(points, setPoints) {
  const [
    {
      tension,
      closed,
      showSpline,
      arcSegments,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      attractorStrength,
      attractorRadius,
    },
  ] = useControls('Smoke Test', () => ({
    Spline: folder(
      {
        tension: {
          label: 'Tension',
          value: SPLINE_PRESETS.Default.tension,
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
              return [
                ...prev,
                last
                  .clone()
                  .add(
                    new THREE.Vector3(
                      (Math.random() - 0.5) * 200,
                      Math.random() * 100,
                      (Math.random() - 0.5) * 200
                    )
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
      { collapsed: false }
    ),

    Smoke: folder(
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
          value: '#3a3a3a',
        },
        opacity: {
          label: 'Opacity',
          value: 0.07,
          min: 0.01,
          max: 1,
          step: 0.005,
        },
      },
      { collapsed: false }
    ),

    Physics: folder(
      {
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
      },
      { collapsed: true }
    ),

    'Attractor Physics': folder(
      {
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
      },
      { collapsed: true }
    ),

    ...(localEnv()
      ? {
          copyPreset: button(
            () => {
              const snap = {
                tension,
                closed,
                particleCount,
                particleSize,
                particleColor,
                opacity,
                springK,
                flowSpeed,
                damping,
                turbulence,
                turbulenceSpeed,
                spawnSpread,
                maxDrift,
                attractorStrength,
                attractorRadius,
                points: points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
              };
              const str = JSON.stringify(snap, null, 2).replace(
                /"([A-Za-z_$][A-Za-z0-9_$]*)"\s*:/g,
                '$1:'
              );
              navigator.clipboard.writeText(str);
            },
            { label: 'Copy Preset' }
          ),
        }
      : {}),
  }));

  return useMemo(
    () => ({
      tension,
      closed,
      showSpline,
      arcSegments,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      attractorStrength,
      attractorRadius,
    }),
    [
      tension,
      closed,
      showSpline,
      arcSegments,
      particleCount,
      particleSize,
      particleColor,
      opacity,
      springK,
      flowSpeed,
      damping,
      turbulence,
      turbulenceSpeed,
      spawnSpread,
      maxDrift,
      attractorStrength,
      attractorRadius,
    ]
  );
}
