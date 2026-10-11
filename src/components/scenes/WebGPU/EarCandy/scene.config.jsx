import React, { lazy } from 'react';
import { FaMusic } from 'react-icons/fa';

function SceneIcon() {
  return <FaMusic color="#7fd6ff" />;
}

export default {
  id: 'earCandy',
  label: 'Ear Candy',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./EarCandy')),
};
