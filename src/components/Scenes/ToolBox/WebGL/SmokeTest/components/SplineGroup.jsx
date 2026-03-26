import React, { useCallback, useMemo } from 'react';

import SmokeParticles from '../../../../../elements/smoke/SmokeParticles';
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
      />

      <SplineLine
        points={points}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color="#aaaaaa"
        visible={splineConfig.showSpline}
        arcSegments={splineConfig.arcSegments}
      />

      {config.showClassicSmoke && (
        <SmokeParticles
          points={points}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}

      {config.showVolSmoke && (
        <VolumetricSmokeParticles
          points={points}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}
    </>
  );
}
