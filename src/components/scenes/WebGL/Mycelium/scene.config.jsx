import React, { lazy } from 'react';
import { PiVirusDuotone } from 'react-icons/pi';

function SceneIcon() {
  return (
    <>
      <PiVirusDuotone color="#9ca3af" />
      <PiVirusDuotone color="#dc2626" style={{ transform: 'rotate(180deg)' }} />
    </>
  );
}

export default {
  id: 'mycelium',
  label: 'Mycelium',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Mycelium')),
};
