import React, { lazy } from 'react';
import { TbDiamonds } from 'react-icons/tb';

function SceneIcon() {
  return <TbDiamonds color="#c53544" size={24} />;
}
export default {
  id: 'argyle',
  label: 'Argyle',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Argyle')),
};
