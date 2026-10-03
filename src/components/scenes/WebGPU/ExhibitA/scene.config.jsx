import React, { lazy } from 'react';
import { GiGreekTemple } from 'react-icons/gi';

function SceneIcon() {
  return <GiGreekTemple color="#111827" />;
}

export default {
  id: 'exhibitA',
  label: 'Exhibit A',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./ExhibitA')),
};
