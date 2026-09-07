import React, { lazy } from 'react';
import { GiSpermWhale } from 'react-icons/gi';

function SceneIcon() {
  return <GiSpermWhale color="#111827" />;
}

export default {
  Component: lazy(() => import('./Explorer')),
  area: 'wip',
  channel: 'webgpu',
  icon: SceneIcon,
  id: 'explorer',
  label: 'Explorer',
};
