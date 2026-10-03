import React, { lazy } from 'react';
import { TbBuildingMonument } from 'react-icons/tb';

function SceneIcon() {
  return <TbBuildingMonument color="#8f8b83" size={24} />;
}

export default {
  id: 'brutalist',
  label: 'Brutalist',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Brutalist')),
};
