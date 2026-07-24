import React, { lazy } from 'react';
import { PiDiamondsFourFill, PiDiamondsFourThin } from 'react-icons/pi';

function SceneIcon() {
  return (
    <>
      <PiDiamondsFourThin color="#111827" />
      <PiDiamondsFourFill color="#374151" />
      <PiDiamondsFourThin color="#111827" />
    </>
  );
}

export default {
  id: 'watercolorSquares',
  label: 'Watercolor Squares',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./WatercolorSquares')),
};
