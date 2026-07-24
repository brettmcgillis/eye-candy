import React, { lazy } from 'react';
import { GiMoneyStack } from 'react-icons/gi';

function SceneIcon() {
  return <GiMoneyStack color="#328304" size={26} />;
}

export default {
  id: 'burningCash',
  label: 'Burning Cash',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./BurningCash')),
};
