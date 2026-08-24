import React, { lazy } from 'react';
import { TbSquare } from 'react-icons/tb';

function SceneIcon() {
  return (
    <>
      <TbSquare color="#111827" style={{ fontSize: '1em' }} />
      <TbSquare color="#374151" style={{ fontSize: '0.7em' }} />
      <TbSquare color="#6b7280" style={{ fontSize: '0.45em' }} />
    </>
  );
}

export default {
  id: 'paperCuts',
  label: 'Paper Cuts',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./PaperCuts')),
};
