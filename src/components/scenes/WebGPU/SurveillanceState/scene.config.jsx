import React, { lazy } from 'react';
import { PiSecurityCamera, PiTelevisionSimple } from 'react-icons/pi';

function SceneIcon() {
  return (
    <>
      <PiSecurityCamera color="#000000" size={26} />
      <PiTelevisionSimple color="#000000" size={26} />
    </>
  );
}

export default {
  id: 'surveillanceState',
  label: 'Surveillance State',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./SurveillanceState')),
};
