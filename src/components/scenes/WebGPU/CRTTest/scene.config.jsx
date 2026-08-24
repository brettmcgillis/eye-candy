import React, { lazy } from 'react';
import { TbDeviceTvOldFilled } from 'react-icons/tb';

function SceneIcon() {
  return <TbDeviceTvOldFilled color="#111827" />;
}

export default {
  id: 'crtTest',
  label: 'CRT Test',
  channel: 'webgpu',
  area: 'toolbox',
  route: 'crtTest-webgpu',
  icon: SceneIcon,
  Component: lazy(() => import('./CRTTest')),
};
