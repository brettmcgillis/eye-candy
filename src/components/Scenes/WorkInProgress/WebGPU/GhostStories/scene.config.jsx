import React, { lazy } from 'react';
import { FaBook, FaGhost } from 'react-icons/fa';

function SceneIcon() {
  return (
    <>
      <FaBook color="#4f46e5" />
      <FaGhost color="#e2e8f0" />
    </>
  );
}

export default {
  id: 'ghostStories',
  label: 'Ghost Stories',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./GhostStories')),
};
