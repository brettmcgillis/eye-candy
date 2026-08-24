import React, { lazy } from 'react';
import { TbAtom2Filled } from 'react-icons/tb';

function SceneIcon() {
  return <TbAtom2Filled color="#6a00a2" size={26} />;
}

export default {
  id: 'apparitions',
  label: 'Apparitions',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Apparitions')),
};
