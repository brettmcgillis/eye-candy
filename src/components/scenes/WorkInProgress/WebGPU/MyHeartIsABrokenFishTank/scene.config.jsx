import React, { lazy } from 'react';
import { GiAquarium } from 'react-icons/gi';

function SceneIcon() {
  return <GiAquarium color="#00125a" size={26} />;
}

export default {
  id: 'myHeartIsABrokenFishTank',
  label: 'My Heart Is A Broken Fish Tank',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./MyHeartIsABrokenFishTank')),
};
