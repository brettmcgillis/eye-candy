import React, { lazy } from 'react';
import { FaLeaf } from 'react-icons/fa6';

function SceneIcon() {
  return <FaLeaf color="#009842" size={26} />;
}

export default {
  id: 'windswept',
  label: 'Windswept',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Windswept')),
};
