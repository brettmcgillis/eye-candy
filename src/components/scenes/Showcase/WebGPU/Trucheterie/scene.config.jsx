import React, { lazy } from 'react';
import { LuBlend } from 'react-icons/lu';

function SceneIcon() {
  return <LuBlend color="#141414" size={22} />;
}

export default {
  id: 'trucheterie',
  label: 'Trucheterie',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Trucheterie')),
};
