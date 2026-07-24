import React, { lazy } from 'react';
import { GiCrackedGlass } from 'react-icons/gi';

function SceneIcon() {
  return <GiCrackedGlass color="#5490ac" size={26} />;
}

export default {
  id: 'windowBreaker',
  label: 'Window Breaker',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./WindowBreaker')),
};
