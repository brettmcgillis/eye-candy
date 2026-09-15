import React, { lazy } from 'react';
import { BsBoxes } from 'react-icons/bs';

function SceneIcon() {
  return <BsBoxes color="#111827" />;
}

export default {
  id: 'nestingBoxes',
  label: 'Nesting Boxes',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./NestingBoxes')),
};
