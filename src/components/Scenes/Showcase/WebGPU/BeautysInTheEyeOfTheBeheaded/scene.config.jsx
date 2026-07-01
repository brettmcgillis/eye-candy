import React, { lazy } from 'react';
import { FaSkullCrossbones } from 'react-icons/fa';

function SceneIcon() {
  return <FaSkullCrossbones color="#111827" />;
}

export default {
  id: 'beautyIsInTheEyeOfTheBeheaded',
  label: 'Beauty Is In The Eye Of The Beheaded',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./BeautysInTheEyeOfTheBeheaded')),
};
