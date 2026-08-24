import React, { lazy } from 'react';
import { GiCctvCamera } from 'react-icons/gi';

function SceneIcon() {
  return <GiCctvCamera color="#000000" size={26} />;
}

export default {
  id: 'birdsArentReal',
  label: "Birds Aren't Real",
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./BirdsArentReal')),
};
