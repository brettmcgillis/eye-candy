import React, { lazy } from 'react';
import { GiInkSwirl } from 'react-icons/gi';

function SceneIcon() {
  return <GiInkSwirl color="#000000" size={26} />;
}

export default {
  id: 'rorschach',
  label: 'Rorschach',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Rorschach')),
};
