import React, { lazy } from 'react';
import { PiPaintBrushDuotone } from 'react-icons/pi';

function SceneIcon() {
  return <PiPaintBrushDuotone color="#a65e5b" />;
}

const Component = lazy(() => import('./Three5'));

export default [
  {
    id: 'three5',
    label: 'Three5.JS',
    channel: 'webgl',
    area: 'testlab',
    icon: SceneIcon,
    Component,
  },
  {
    id: 'three5',
    label: 'Three5.JS',
    channel: 'webgpu',
    route: 'three5-webgpu',
    area: 'testlab',
    icon: SceneIcon,
    Component,
  },
];
