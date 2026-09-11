import React, { lazy } from 'react';
import { TbBuildingCommunity } from 'react-icons/tb';

function SceneIcon() {
  return <TbBuildingCommunity color="#141414" size={24} />;
}

export default {
  id: 'blockParty',
  label: 'Block Party',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./BlockParty')),
};
