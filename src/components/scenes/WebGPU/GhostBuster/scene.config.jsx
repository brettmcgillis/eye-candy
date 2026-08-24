import React, { lazy } from 'react';
import { FaGhost } from 'react-icons/fa';

function SceneIcon() {
  return <FaGhost color="#cbd5e1" />;
}

export default {
  id: 'ghostBuster',
  label: 'Ghost Buster',
  channel: 'webgpu',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./GhostBuster')),
};
