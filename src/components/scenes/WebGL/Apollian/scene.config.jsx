import React, { lazy } from 'react';
import { GiAbstract050 } from 'react-icons/gi';

function SceneIcon() {
  return <GiAbstract050 color="#111827" />;
}

export default {
  id: 'apollian',
  label: 'Apollian',
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Apollian')),
};
