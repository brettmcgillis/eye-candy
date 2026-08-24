import React, { lazy } from 'react';
import { FaBone } from 'react-icons/fa';

function SceneIcon() {
  return <FaBone color="#e2e8f0" />;
}

export default {
  id: 'theBoneZone',
  label: 'TheBoneZone',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./TheBoneZone')),
};
