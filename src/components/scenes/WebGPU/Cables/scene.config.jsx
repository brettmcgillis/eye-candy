import React, { lazy } from 'react';
import { LuCable } from 'react-icons/lu';

function SceneIcon() {
  return <LuCable color="#c8462d" size={24} />;
}

export default {
  id: 'cables',
  label: 'Cables',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Cables')),
};
