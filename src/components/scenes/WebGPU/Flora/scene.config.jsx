import React, { lazy } from 'react';
import { PiPlantDuotone } from 'react-icons/pi';

function SceneIcon() {
  return <PiPlantDuotone color="#141414" size={24} />;
}

export default {
  id: 'flora',
  label: 'Flora',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Flora')),
};
