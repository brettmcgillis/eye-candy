import React, { lazy } from 'react';
import { GiPaperBoat } from 'react-icons/gi';

function SceneIcon() {
  return <GiPaperBoat color="#93c5fd" />;
}

export default {
  id: 'rowItAlone',
  label: 'Row It Alone',
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./RowItAlone')),
};
