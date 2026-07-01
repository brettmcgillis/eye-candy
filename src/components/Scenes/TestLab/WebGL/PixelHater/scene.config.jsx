import React, { lazy } from 'react';
import { BiSolidInvader } from 'react-icons/bi';

function SceneIcon() {
  return <BiSolidInvader color="#a855f7" />;
}

export default {
  id: 'pixelHater',
  label: 'PixelHater',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./PixelHater')),
};
