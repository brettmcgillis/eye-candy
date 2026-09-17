import React, { lazy } from 'react';
import { DiDigitalOcean } from 'react-icons/di';

function SceneIcon() {
  return <DiDigitalOcean color="#000000" size={26} />;
}

export default {
  id: 'digitalRain',
  label: 'Digital Rain',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./DigitalRain')),
};
