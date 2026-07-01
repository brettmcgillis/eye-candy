import React, { lazy } from 'react';
import { TbDeviceTvOldFilled } from 'react-icons/tb';

function SceneIcon() {
  return <TbDeviceTvOldFilled color="#111827" />;
}

export default {
  id: 'crtTest',
  label: 'CRT Test',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./CRTTest')),
};
