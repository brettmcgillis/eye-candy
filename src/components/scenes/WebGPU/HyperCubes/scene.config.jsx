import React, { lazy } from 'react';
import { TbCube3dSphere } from 'react-icons/tb';

function SceneIcon() {
  return <TbCube3dSphere color="#b8333c" size={24} />;
}

export default {
  id: 'hyperCubes',
  label: 'HyperCubes',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./HyperCubes')),
};
