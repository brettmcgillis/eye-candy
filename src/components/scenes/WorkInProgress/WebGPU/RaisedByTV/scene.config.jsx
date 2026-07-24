import React, { lazy } from 'react';
import { TbDeviceTvOldFilled } from 'react-icons/tb';

function SceneIcon() {
  return <TbDeviceTvOldFilled color="#111827" />;
}

export default {
  id: 'raisedByTv',
  label: 'Raised By TV',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./RaisedByTV')),
};
