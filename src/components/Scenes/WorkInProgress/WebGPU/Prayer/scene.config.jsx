import React, { lazy } from 'react';
import { FaPrayingHands } from 'react-icons/fa';

function SceneIcon() {
  return <FaPrayingHands color="#710000" />;
}

export default {
  id: 'prayer',
  label: 'Prayer',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Prayer')),
};
