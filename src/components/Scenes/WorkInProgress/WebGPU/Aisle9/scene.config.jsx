import React, { lazy } from 'react';
import { PiPlanetFill } from 'react-icons/pi';

function SceneIcon() {
  return <PiPlanetFill color="#202020" size={26} />;
}

export default {
  id: 'aisle9',
  label: 'Aisle 9',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Aisle9')),
};
