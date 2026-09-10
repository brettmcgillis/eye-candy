import React, { lazy } from 'react';
import { TbVectorSpline } from 'react-icons/tb';

function SceneIcon() {
  return <TbVectorSpline color="#000000" size={26} />;
}

export default {
  Component: lazy(() => import('./AvoidantPersonalities')),
  area: 'wip',
  channel: 'webgpu',
  icon: SceneIcon,
  id: 'avoidantPersonalities',
  label: 'Avoidant Personalities',
};
