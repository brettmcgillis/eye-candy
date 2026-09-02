import React, { lazy } from 'react';
import { TbSunElectricity } from 'react-icons/tb';

function SceneIcon() {
  return <TbSunElectricity color="#000000" size={26} />;
}

export default {
  id: 'youreLookingRadiant',
  label: "You're Looking Radiant",
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./YoureLookingRadiant')),
};
