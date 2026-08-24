import React, { lazy } from 'react';
import { FaMobileAlt } from 'react-icons/fa';

function SceneIcon() {
  return <FaMobileAlt color="#64748b" />;
}

export default {
  id: 'mobilePhysicsTest',
  label: 'Mobile Physics Test',
  channel: 'webgpu',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./MobilePhysicsTest')),
};
