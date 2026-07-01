import React, { lazy } from 'react';
import { GiSpray } from 'react-icons/gi';

function SceneIcon() {
  return (
    <>
      <GiSpray color="#680000" size={26} />
      <GiSpray color="#040162" size={26} style={{ transform: 'scaleX(-1)' }} />
    </>
  );
}

export default {
  id: 'wetPaint',
  label: 'Wet Paint',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./WetPaint')),
};
