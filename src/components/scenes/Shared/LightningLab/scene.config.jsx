import React, { lazy } from 'react';
import { BsLightningFill } from 'react-icons/bs';

function SceneIcon() {
  return (
    <>
      <BsLightningFill color="#fef08a" />
    </>
  );
}

const Component = lazy(() => import('./LightningLab'));

export default [
  {
    id: 'lightningLab',
    label: 'Lightning Lab',
    channel: 'webgl',
    area: 'testlab',
    icon: SceneIcon,
    Component,
  },
  {
    id: 'lightningLab',
    label: 'Lightning Lab',
    channel: 'webgpu',
    area: 'testlab',
    route: 'lightningLab-webgpu',
    icon: SceneIcon,
    Component,
  },
];
