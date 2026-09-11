import React, { lazy } from 'react';
import { PiMountainsDuotone } from 'react-icons/pi';

function SceneIcon() {
  return <PiMountainsDuotone color="#111827" />;
}

export default {
  id: 'endlessErosion',
  label: 'Endless Erosion',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./EndlessErosion')),
};
