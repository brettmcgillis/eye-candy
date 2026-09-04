import React, { lazy } from 'react';
import { GiLightningBranches } from 'react-icons/gi';

function SceneIcon() {
  return <GiLightningBranches color="#005586" size={24} />;
}

export default {
  id: 'theSpeedOfLightning',
  label: 'The Speed Of Lightning',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./TheSpeedOfLightning')),
};
