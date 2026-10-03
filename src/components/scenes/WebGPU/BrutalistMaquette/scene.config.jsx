import React, { lazy } from 'react';
import { TbBuildingCommunity } from 'react-icons/tb';

function SceneIcon() {
  return <TbBuildingCommunity color="#d8d4cc" size={24} />;
}

export default {
  id: 'brutalistMaquette',
  label: 'BrutalistMaquette',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./BrutalistMaquette')),
};
