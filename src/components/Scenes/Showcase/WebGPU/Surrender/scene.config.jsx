import React, { lazy } from 'react';
import { GiBlackFlag } from 'react-icons/gi';

function SceneIcon() {
  return <GiBlackFlag color="#000000" size={24} />;
}

export default {
  id: 'surrender',
  label: 'Surrender',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Surrender')),
};
