import React, { lazy } from 'react';
import { TbLayoutBoardSplit } from 'react-icons/tb';

function SceneIcon() {
  return <TbLayoutBoardSplit color="#141414" size={22} />;
}

export default {
  id: 'subdivision',
  label: 'Subdivision',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Subdivision')),
};
