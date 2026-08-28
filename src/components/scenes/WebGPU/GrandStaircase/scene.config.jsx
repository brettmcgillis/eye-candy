import React, { lazy } from 'react';
import { PiStairsFill } from 'react-icons/pi';

function SceneIcon() {
  return <PiStairsFill color="#3c3c3c" size={24} />;
}

export default {
  id: 'grandStaircase',
  label: 'GrandStaircase',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./GrandStaircase')),
};
