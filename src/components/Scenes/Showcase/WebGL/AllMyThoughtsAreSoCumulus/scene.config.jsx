import React, { lazy } from 'react';
import { FaCloud } from 'react-icons/fa';
import { PiSkullDuotone } from 'react-icons/pi';

function SceneIcon() {
  return (
    <>
      <PiSkullDuotone color="#94a3b8" />
      <FaCloud color="#7dd3fc" />
    </>
  );
}

export default {
  id: 'allMyThoughtsAreSoCumulus',
  label: 'All My Thoughts Are So Cumulus',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./AllMyThoughtsAreSoCumulus')),
};
