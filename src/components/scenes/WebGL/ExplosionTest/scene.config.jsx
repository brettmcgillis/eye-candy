import React, { lazy } from 'react';
import { FaBomb } from 'react-icons/fa';

function SceneIcon() {
  return <FaBomb color="#374151" />;
}

export default {
  id: 'explosionTest',
  label: 'Explosion Test',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./ExplosionTest')),
};
