import React, { lazy } from 'react';
import { PiHairDryerDuotone } from 'react-icons/pi';

function SceneIcon() {
  return <PiHairDryerDuotone color="#a78bfa" />;
}

const Component = lazy(() => import('./FurLab'));

export default [
  {
    id: 'furLab',
    label: 'Fur Lab',
    channel: 'webgl',
    area: 'testlab',
    icon: SceneIcon,
    Component,
  },
  {
    id: 'furLab',
    label: 'Fur Lab',
    channel: 'webgpu',
    area: 'testlab',
    route: 'furLabWebgpu',
    icon: SceneIcon,
    Component,
  },
];
