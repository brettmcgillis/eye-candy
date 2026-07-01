import React, { lazy } from 'react';
import { PiHairDryerDuotone } from 'react-icons/pi';

function SceneIcon() {
  return <PiHairDryerDuotone color="#a78bfa" />;
}

export default {
  id: 'furLab',
  label: 'Fur Lab',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./FurLab')),
};
