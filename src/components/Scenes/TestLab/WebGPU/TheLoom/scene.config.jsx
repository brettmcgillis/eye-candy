import React, { lazy } from 'react';
import { GiSewingString } from 'react-icons/gi';

function SceneIcon() {
  return <GiSewingString color="#e2e8f0" />;
}

export default {
  id: 'theLoom',
  label: 'The Loom',
  channel: 'webgpu',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./TheLoom')),
};
