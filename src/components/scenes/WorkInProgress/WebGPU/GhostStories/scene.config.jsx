import React, { lazy } from 'react';
import { GiBookCover } from 'react-icons/gi';
import { LiaGhostSolid } from 'react-icons/lia';

function SceneIcon() {
  return (
    <>
      <LiaGhostSolid
        color="#000000"
        size={26}
        style={{ transform: 'scaleX(-1)' }}
      />
      <GiBookCover color="#602600" size={26} />
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
