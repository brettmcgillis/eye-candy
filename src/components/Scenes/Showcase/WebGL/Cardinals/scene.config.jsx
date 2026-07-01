import React, { lazy } from 'react';
import { PiBirdDuotone } from 'react-icons/pi';

function SceneIcon() {
  return (
    <>
      <PiBirdDuotone color="#dc2626" />
      <PiBirdDuotone color="#ef4444" />
    </>
  );
}

export default {
  id: 'cardinals',
  label: 'Cardinals',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Cardinals')),
};
