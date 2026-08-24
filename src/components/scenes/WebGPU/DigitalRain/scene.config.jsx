import React, { lazy } from 'react';
import { WiCloudyGusts } from 'react-icons/wi';

function SceneIcon() {
  return <WiCloudyGusts color="#000000" size={26} />;
}

export default {
  id: 'digitalRain',
  label: 'Digital Rain',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./DigitalRain')),
};
