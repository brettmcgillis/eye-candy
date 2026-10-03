import React, { lazy } from 'react';
import { GiStairs } from 'react-icons/gi';

function SceneIcon() {
  return <GiStairs color="#94a3b8" />;
}

export default {
  id: 'isoLinesRelief',
  label: 'Iso Lines Relief',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./IsoLinesRelief')),
};
