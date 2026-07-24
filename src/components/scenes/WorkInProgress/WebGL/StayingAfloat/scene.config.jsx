import React, { lazy } from 'react';
import { ImLifebuoy } from 'react-icons/im';

function SceneIcon() {
  return <ImLifebuoy color="#ef4444" />;
}

export default {
  id: 'stayingAfloat',
  label: 'Staying Afloat',
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./StayingAfloat')),
};
