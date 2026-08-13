import React, { lazy } from 'react';
import { GiHoneycomb } from 'react-icons/gi';

function SceneIcon() {
  return <GiHoneycomb color="#000000" size={26} />;
}

export default {
  id: 'hexTrees',
  label: 'Hex Trees',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./HexTrees')),
};
