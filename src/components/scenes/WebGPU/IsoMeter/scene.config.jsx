import React, { lazy } from 'react';
import { TbCube } from 'react-icons/tb';

function SceneIcon() {
  return <TbCube color="#1d1d1d" size={22} />;
}

export default {
  id: 'isoMeter',
  label: 'Iso Meter',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./IsoMeter')),
};
