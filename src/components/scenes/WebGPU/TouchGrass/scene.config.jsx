import React, { lazy } from 'react';
import { GiHighGrass } from 'react-icons/gi';

function SceneIcon() {
  return <GiHighGrass color="#034907" size={24} />;
}

export default {
  id: 'touchGrass',
  label: 'Touch Grass',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./TouchGrass')),
};
