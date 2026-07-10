import React, { lazy } from 'react';
import { FaBook } from 'react-icons/fa';
import { LiaGhostSolid } from 'react-icons/lia';

function SceneIcon() {
  return (
    <>
      <LiaGhostSolid color="#000000" size={26} />
      <FaBook color="#602600" />
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
