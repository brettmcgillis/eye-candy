import React, { lazy } from 'react';
import { GiLightningBranches } from 'react-icons/gi';

function SceneIcon() {
  return <GiLightningBranches color="#005586" size={24} />;
}

export default {
  id: 'thunderAndLightness',
  label: 'Thunder And Lightness',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./ThunderAndLightness')),
};
