import React, { lazy } from 'react';
import { FaSkullCrossbones } from 'react-icons/fa';

function SceneIcon() {
  return <FaSkullCrossbones color="#e5e7eb" />;
}

export default {
  id: 'drippingSkull',
  label: 'Dripping Skull',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./DrippingSkull')),
};
