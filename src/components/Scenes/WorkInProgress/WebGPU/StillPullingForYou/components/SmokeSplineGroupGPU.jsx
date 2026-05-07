// SmokeSplineGroupGPU — WebGPU equivalent of SmokeSplineGroup.
// Identical structure to SmokeSplineGroup.jsx but uses TSL-based
// SmokeParticlesGPU and VolumetricSmokeParticlesGPU instead of the
// GLSL-based originals.
import React, { useCallback, useMemo } from 'react';

import SmokeParticlesGPU from '../../../../../elements/smoke/SmokeParticlesGPU';
import VolumetricSmokeParticlesGPU from '../../../../../elements/smoke/VolumetricSmokeParticlesGPU';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';

export default function SmokeSplineGroupGPU({
  index,
  points,
  splineConfig,
  editSplines = false,
  setSplinePoints,
}) {
  const setPoints = useCallback(
    (updater) => setSplinePoints(index, updater),
    [index, setSplinePoints]
  );

  const positions = useMemo(() => points.map((pt) => pt.position), [points]);
  const rotations = useMemo(() => points.map((pt) => pt.rotation), [points]);
  const scales = useMemo(() => points.map((pt) => pt.scale), [points]);

  const smokeType = splineConfig.type ?? 'Particle';

  if (!splineConfig.visible) return null;

  return (
    <>
      {editSplines && (
        <SplinePoints
          points={points}
          setPoints={setPoints}
          visible
          mode="translate"
          pointSize={0.15}
        />
      )}

      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color="#ff4444"
        visible={editSplines}
        arcSegments={splineConfig.arcSegments}
      />

      {smokeType === 'Particle' ? (
        <SmokeParticlesGPU
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={splineConfig}
        />
      ) : (
        <VolumetricSmokeParticlesGPU
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={splineConfig}
        />
      )}
    </>
  );
}
