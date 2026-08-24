import React, { lazy } from 'react';
import { GiPaperBoat } from 'react-icons/gi';

function SceneIcon() {
  return <GiPaperBoat color="#93c5fd" />;
}

export default {
  id: 'rowItAloneWebgpu',
  label: 'Row It Alone',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./RowItAlone')),
};
