import React, { lazy } from 'react';
import { GiHighGrass } from 'react-icons/gi';

function SceneIcon() {
  return <GiHighGrass color="#000000" size={24} />;
}

export default {
  id: 'fromTheDirt',
  label: 'From The Dirt',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./FromTheDirt')),
};
