import React, { lazy } from 'react';
import { GiStarsStack } from 'react-icons/gi';

function SceneIcon() {
  return <GiStarsStack color="#141414" size={24} />;
}

export default {
  id: 'kumiko',
  label: 'Kumiko',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Kumiko')),
};
