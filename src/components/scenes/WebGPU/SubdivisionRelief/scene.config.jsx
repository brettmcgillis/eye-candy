import React, { lazy } from 'react';
import { TbBoxMultiple } from 'react-icons/tb';

function SceneIcon() {
  return <TbBoxMultiple color="#141414" size={22} />;
}

export default {
  id: 'subdivisionRelief',
  label: 'Subdivision Relief',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./SubdivisionRelief')),
};
