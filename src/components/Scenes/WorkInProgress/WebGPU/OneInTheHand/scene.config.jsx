import React, { lazy } from 'react';
import { GiHummingbird, GiRibcage } from 'react-icons/gi';

function SceneIcon() {
  return (
    <>
      <GiHummingbird color="#24a8fb" />
      <GiRibcage color="#808a99" size={26} />
    </>
  );
}

export default {
  id: 'oneInTheHand',
  label: 'One In The Hand',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./OneInTheHand')),
};
