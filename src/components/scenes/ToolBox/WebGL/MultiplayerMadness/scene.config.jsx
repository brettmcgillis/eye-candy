import React, { lazy } from 'react';
import { MdDirectionsRun } from 'react-icons/md';

function SceneIcon() {
  return (
    <>
      <MdDirectionsRun color="#10b981" />
      <MdDirectionsRun color="#6ee7b7" />
    </>
  );
}

export default {
  id: 'multiplayerMadness',
  label: 'Multiplayer Madness',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./MultiplayerMadness')),
};
