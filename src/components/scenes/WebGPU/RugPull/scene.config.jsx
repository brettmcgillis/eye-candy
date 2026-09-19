import React, { lazy } from 'react';
import { GiRolledCloth } from 'react-icons/gi';

function SceneIcon() {
  return <GiRolledCloth color="#8e1b1b" />;
}

export default {
  id: 'rugPull',
  label: 'Rug Pull',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./RugPull')),
};
