import React, { lazy } from 'react';
import { LiaDumpsterFireSolid } from 'react-icons/lia';

function SceneIcon() {
  return <LiaDumpsterFireSolid color="#111827" size={25} />;
}

export default {
  id: 'dumpsterFire',
  label: 'Dumpster Fire',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./DumpsterFire')),
};
