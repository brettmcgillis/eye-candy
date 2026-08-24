import React, { lazy } from 'react';
import { GiHummingbird } from 'react-icons/gi';

function SceneIcon() {
  return <GiHummingbird color="#029dc0" size={26} />;
}

export default {
  id: 'weightless',
  label: 'Weightless',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Weightless')),
};
