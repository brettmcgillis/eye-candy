import React, { lazy } from 'react';
import { GiMountains } from 'react-icons/gi';

function SceneIcon() {
  return <GiMountains color="#94a3b8" />;
}

export default {
  id: 'isoLines',
  label: 'Iso Lines',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./IsoLines')),
};
