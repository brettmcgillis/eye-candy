import React, { lazy } from 'react';
import { GiCarWheel, GiCrackedGlass } from 'react-icons/gi';

function SceneIcon() {
  return (
    <>
      <GiCarWheel color="#000000" size={26} />
      <GiCrackedGlass color="#000000" size={26} />
    </>
  );
}

export default {
  id: 'getWrecked',
  label: 'Get Wrecked',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./GetWrecked')),
};
