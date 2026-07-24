import React, { lazy } from 'react';
import { GiCandleLight } from 'react-icons/gi';

function SceneIcon() {
  return <GiCandleLight color="#fbbf24" />;
}

export default {
  id: 'burningAtBothEnds',
  label: 'Burning At Both Ends',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./BurningAtBothEnds')),
};
