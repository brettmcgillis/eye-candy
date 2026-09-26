import React, { lazy } from 'react';
import { GiYarn } from 'react-icons/gi';

function SceneIcon() {
  return <GiYarn color="#7dd3fc" size={24} />;
}

export default {
  id: 'strings',
  label: 'Strings',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Strings')),
};
