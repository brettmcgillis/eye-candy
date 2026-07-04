import React, { lazy } from 'react';
import { GiPaperCrane } from 'react-icons/gi';

function SceneIcon() {
  return <GiPaperCrane color="#c9c2b0" size={26} />;
}

export default {
  id: 'whiteLies',
  label: 'White Lies',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./WhiteLies')),
};
