import React, { lazy } from 'react';
import { GiMushroomGills } from 'react-icons/gi';

function SceneIcon() {
  return <GiMushroomGills color="#141414" size={24} />;
}

export default {
  id: 'fungi',
  label: 'Fungi',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Fungi')),
};
