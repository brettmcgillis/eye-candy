import React, { lazy } from 'react';
import { GiRopeCoil } from 'react-icons/gi';

function SceneIcon() {
  return <GiRopeCoil color="#141414" size={22} />;
}

export default {
  id: 'trucheterie3d',
  label: 'Trucheterie 3D',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Trucheterie3D')),
};
