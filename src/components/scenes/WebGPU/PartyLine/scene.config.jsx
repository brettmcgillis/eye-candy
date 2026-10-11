import React, { lazy } from 'react';
import { PiScribbleLoopBold } from 'react-icons/pi';

function SceneIcon() {
  return <PiScribbleLoopBold color="#000000" size={26} />;
}

export default {
  id: 'partyLine',
  label: 'Party Line',
  channel: 'webgpu',
  area: 'wip',
  title: false,
  hideUI: true,
  icon: SceneIcon,
  Component: lazy(() => import('./PartyLine')),
};
