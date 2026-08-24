import React, { lazy } from 'react';
import { FaGhost } from 'react-icons/fa';

function SceneIcon() {
  return <FaGhost color="#cbd5e1" />;
}

export default {
  id: 'allMyFriendsAreGhosts',
  label: 'All My Friends Are Ghosts',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./AllMyFriendsAreGhosts')),
};
