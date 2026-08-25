import React, { lazy } from 'react';
import { GiHeavyRain } from 'react-icons/gi';

function SceneIcon() {
  return <GiHeavyRain color="#0358ad" size={24} />;
}

export default {
  id: 'waterCycle',
  label: 'WaterCycle',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./WaterCycle')),
};
