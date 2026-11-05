import React, { lazy } from 'react';
import { PiRabbit } from 'react-icons/pi';

function SceneIcon() {
  return <PiRabbit color="#6a6a6a" size={24} />;
}

export default {
  id: 'stayHunted',
  label: 'Stay Hunted',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./StayHunted')),
};
