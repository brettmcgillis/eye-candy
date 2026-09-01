import React, { lazy } from 'react';
import { BsLightningChargeFill } from 'react-icons/bs';

function SceneIcon() {
  return <BsLightningChargeFill color="#6cc3f5" size={24} />;
}

export default {
  id: 'thunderAndLightness',
  label: 'Thunder And Lightness',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./ThunderAndLightness')),
};
