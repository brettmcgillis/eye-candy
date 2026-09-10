import React, { lazy } from 'react';
import { RxShadow } from 'react-icons/rx';

function SceneIcon() {
  return <RxShadow color="#000000" size={26} />;
}

export default {
  id: 'youreLookingRadiant',
  label: "You're Looking Radiant",
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./YoureLookingRadiant')),
};
