import React, { lazy } from 'react';
import { FaPen } from 'react-icons/fa';

function SceneIcon() {
  return <FaPen color="#1e293b" />;
}

export default {
  id: 'penPlotter',
  label: 'Pen Plotter',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./PenPlotter')),
};
