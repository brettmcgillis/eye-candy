import React, { lazy } from 'react';
import { RxShadow } from 'react-icons/rx';

function SceneIcon() {
  return <RxShadow color="#000000" size={26} />;
}

export default {
  id: 'youreLookingRadiant3D',
  label: "You're Looking Radiant 3D",
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./YoureLookingRadiant3D')),
};
