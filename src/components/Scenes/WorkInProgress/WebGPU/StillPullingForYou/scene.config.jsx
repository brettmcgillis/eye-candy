import React, { lazy } from 'react';
import { GiSinkingShip } from 'react-icons/gi';

function SceneIcon() {
  return <GiSinkingShip color="#1e40af" />;
}

export default {
  id: 'stillPullingForYou',
  label: 'Still Pulling For You',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./StillPullingForYou')),
};
