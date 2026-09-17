import React, { lazy } from 'react';
import { GiWaveCrest } from 'react-icons/gi';

function SceneIcon() {
  return <GiWaveCrest color="#0b3a4a" size={24} />;
}

export default {
  id: 'shoreline',
  label: 'Shoreline',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Shoreline')),
};
