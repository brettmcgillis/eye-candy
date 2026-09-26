import React, { lazy } from 'react';
import { GiAlienBug } from 'react-icons/gi';

function SceneIcon() {
  return <GiAlienBug color="#141414" size={24} />;
}

export default {
  id: 'fauna',
  label: 'Fauna',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Fauna')),
};
