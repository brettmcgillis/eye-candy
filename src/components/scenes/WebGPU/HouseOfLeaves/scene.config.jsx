import React, { lazy } from 'react';
import { GiHolyOak } from 'react-icons/gi';

function SceneIcon() {
  return <GiHolyOak color="#6b6a68" size={24} />;
}

export default {
  id: 'houseOfLeaves',
  label: 'House of Leaves',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./HouseOfLeaves')),
};
