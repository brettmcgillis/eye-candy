import React, { lazy } from 'react';
import { GiBrain } from 'react-icons/gi';

function SceneIcon() {
  return <GiBrain color="#01024f" size={24} />;
}

export default {
  id: 'grayMatter',
  label: 'Gray Matter',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./GrayMatter')),
};
