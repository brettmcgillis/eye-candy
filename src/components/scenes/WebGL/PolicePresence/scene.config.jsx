import React, { lazy } from 'react';
import { GiPoliceBadge } from 'react-icons/gi';

function SceneIcon() {
  return <GiPoliceBadge color="#111827" />;
}

export default {
  id: 'policePresence',
  label: 'Police Presence',
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./PolicePresence')),
};
