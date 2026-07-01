import React, { lazy } from 'react';
import { GiRaccoonHead } from 'react-icons/gi';

function SceneIcon() {
  return <GiRaccoonHead color="#000000" size={26} />;
}

export default {
  id: 'urbanWildlife',
  label: 'Urban Wildlife',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./UrbanWildlife')),
};
