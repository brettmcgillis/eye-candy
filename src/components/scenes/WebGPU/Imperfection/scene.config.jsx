import React, { lazy } from 'react';
import { GiPaintBrush } from 'react-icons/gi';

function SceneIcon() {
  return <GiPaintBrush color="#e8803c" />;
}

export default {
  id: 'imperfection',
  label: 'Imperfection',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Imperfection')),
};
