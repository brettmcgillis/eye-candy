import React, { lazy } from 'react';
import { ImLifebuoy } from 'react-icons/im';

function SceneIcon() {
  return <ImLifebuoy color="#ef4444" />;
}

export default {
  id: 'fluidTest',
  label: 'Fluid Test',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./FluidTest')),
};
