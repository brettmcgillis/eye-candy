import React, { lazy } from 'react';
import { BsLightningFill } from 'react-icons/bs';

function SceneIcon() {
  return (
    <>
      <BsLightningFill color="#fef08a" />
      <BsLightningFill color="#fde047" />
      <BsLightningFill color="#f59e0b" />
    </>
  );
}

export default {
  id: 'lightningLab',
  label: 'Lightning Lab',
  channel: 'webgpu',
  area: 'testlab',
  route: 'lightningLab-webgpu',
  icon: SceneIcon,
  Component: lazy(() => import('./LightningLab')),
};
