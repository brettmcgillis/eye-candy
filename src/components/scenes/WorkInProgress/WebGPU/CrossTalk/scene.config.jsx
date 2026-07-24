import React, { lazy } from 'react';
import { FaRegWindowRestore } from 'react-icons/fa';

function SceneIcon() {
  return <FaRegWindowRestore color="#191919" size={23} />;
}

export default {
  id: 'crossTalk',
  label: 'Cross Talk',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./CrossTalk')),
};
