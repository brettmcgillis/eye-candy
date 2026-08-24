import React, { lazy } from 'react';
import { FaPlane } from 'react-icons/fa';

function SceneIcon() {
  return <FaPlane color="#111827" />;
}

export default {
  id: 'flyingHigh',
  label: 'Flying High',
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./FlyingHigh')),
};
