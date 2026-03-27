import React, { useCallback, useMemo } from 'react';

import SmokeParticles from '../../../../../elements/smoke/SmokeParticles';
import SmokeVolumeMesh from '../../../../../elements/smoke/SmokeVolumeMesh';
import VolumetricSmokeParticles from '../../../../../elements/smoke/VolumetricSmokeParticles';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';

export default function SmokeSplineGroup({
  index,
  points,
  config,
  splineConfig,
  attractorsRef,
  setSplinePoints,
}) {
  const setPoints = useCallback(
    (updater) => setSplinePoints(index, updater),
    [index, setSplinePoints]
  );

  const positions = useMemo(() => points.map((pt) => pt.position), [points]);
  const rotations = useMemo(() => points.map((pt) => pt.rotation), [points]);
  const scales = useMemo(() => points.map((pt) => pt.scale), [points]);

  // Merge per-spline settings into config for smoke components
  const mergedConfig = useMemo(
    () => ({
      ...config,
      tension: splineConfig.tension,
      closed: splineConfig.closed,
      arcSegments: splineConfig.arcSegments,
    }),
    [
      config,
      splineConfig.tension,
      splineConfig.closed,
      splineConfig.arcSegments,
    ]
  );

  if (!splineConfig.visible) return null;

  return (
    <>
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={splineConfig.showHelpers}
        mode={config.pointMode}
      />

      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color="#aaaaaa"
        visible={splineConfig.showSpline}
        arcSegments={splineConfig.arcSegments}
      />

      {config.showClassicSmoke && (
        <SmokeParticles
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}

      {config.showVolSmoke && (
        <VolumetricSmokeParticles
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}

      {config.showSmokeVolume && (
        <SmokeVolumeMesh
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          tension={splineConfig.tension}
          closed={splineConfig.closed}
          spread={
            Math.max(config.spawnSpread ?? 0, config.volSpread ?? 0) || 120
          }
        />
      )}
    </>
  );
}
