import React, { lazy } from 'react';
import { GiRabbit } from 'react-icons/gi';

function SceneIcon() {
  return <GiRabbit color="#d1d5db" />;
}

export default {
  id: 'stayHunted',
  label: 'Stay Hunted',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./StayHunted')),
};
