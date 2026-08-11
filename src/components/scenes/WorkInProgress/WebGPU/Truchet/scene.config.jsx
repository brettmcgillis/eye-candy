import React, { lazy } from 'react';
import { BsGrid3X3GapFill } from 'react-icons/bs';

function SceneIcon() {
  return <BsGrid3X3GapFill color="#141414" size={22} />;
}

export default {
  id: 'truchet',
  label: 'Truchet',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Truchet')),
};
