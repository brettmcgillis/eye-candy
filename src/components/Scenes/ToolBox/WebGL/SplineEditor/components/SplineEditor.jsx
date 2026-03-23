import React, { useState } from 'react';

import SplineEditorScene from '../SplineEditorScene';
import useSplineEditorControls from '../hooks/useSplineEditorControls';
import SPLINE_PRESETS from '../../../../../elements/spline/splinePresets';

export default function SplineEditor() {
  const [points, setPoints] = useState(() =>
    SPLINE_PRESETS.Default.points.map((v) => v.clone())
  );

  const config = useSplineEditorControls(points, setPoints);

  return (
    <SplineEditorScene points={points} setPoints={setPoints} config={config} />
  );
}
