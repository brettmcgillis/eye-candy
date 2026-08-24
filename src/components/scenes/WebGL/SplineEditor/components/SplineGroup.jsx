import React, { useCallback, useMemo } from 'react';

import SplineLine from '@elements/Spline/SplineLine';
import SplinePoints from '@elements/Spline/SplinePoints';

function getSplineColors(splineIndex) {
  const hue = (splineIndex * 72) % 360;
  return {
    uniform: `hsl(${hue}, 75%, 55%)`,
    centripetal: `hsl(${(hue + 120) % 360}, 75%, 55%)`,
    chordal: `hsl(${(hue + 240) % 360}, 75%, 55%)`,
  };
}

export default function SplineGroup({
  index,
  points,
  config,
  splineConfig,
  setSplinePoints,
}) {
  const setPoints = useCallback(
    (updater) => setSplinePoints(index, updater),
    [index, setSplinePoints]
  );
  const colors = getSplineColors(index);
  const positions = useMemo(() => points.map((pt) => pt.position), [points]);

  if (!splineConfig.visible) return null;

  return (
    <>
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={config.showPoints}
        mode={config.pointMode}
        pointSize={20}
      />
      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color={colors.uniform}
        visible={config.showUniform}
        arcSegments={splineConfig.arcSegments}
      />
      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="centripetal"
        color={colors.centripetal}
        visible={config.showCentripetal}
        arcSegments={splineConfig.arcSegments}
      />
      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="chordal"
        color={colors.chordal}
        visible={config.showChordal}
        arcSegments={splineConfig.arcSegments}
      />
    </>
  );
}
