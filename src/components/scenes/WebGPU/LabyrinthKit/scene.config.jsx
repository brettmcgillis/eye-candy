import React, { lazy } from 'react';
import { GiStoneStack } from 'react-icons/gi';

function SceneIcon() {
  return <GiStoneStack color="#8b8f98" size={24} />;
}

export default {
  id: 'labyrinthKit',
  label: 'Labyrinth Kit',
  channel: 'webgpu',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./LabyrinthKit')),
};
