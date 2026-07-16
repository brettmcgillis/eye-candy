import React, { lazy } from 'react';
import { FaHouseDamage } from 'react-icons/fa';

function SceneIcon() {
  return <FaHouseDamage size={26} />;
}

export default {
  id: 'abandoned',
  label: 'Abandoned',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Abandoned')),
};
