import React, { lazy } from 'react';
import { GiBroadsword } from 'react-icons/gi';

function SceneIcon() {
  return <GiBroadsword color="#b9b9c4" size={26} />;
}

export default {
  id: 'goodKnight',
  label: 'Good Knight',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./GoodKnight')),
};
