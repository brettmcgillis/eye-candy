import React, { lazy } from 'react';
import { GrCubes } from 'react-icons/gr';

function SceneIcon() {
  return <GrCubes color="#000000" size={26} />;
}

export default {
  id: 'fractalAutomata',
  label: 'Fractal Automata',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./FractalAutomata')),
};
