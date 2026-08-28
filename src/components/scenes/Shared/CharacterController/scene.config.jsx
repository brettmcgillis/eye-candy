import React, { lazy } from 'react';
import { MdDirectionsRun } from 'react-icons/md';

function SceneIcon() {
  return <MdDirectionsRun color="#10b981" />;
}

const CharacterController = lazy(() => import('./Experience'));
const MultiplayerMadness = lazy(() => import('./MultiplayerExperience'));

export default [
  {
    id: 'characterController',
    label: 'Character Controller',
    channel: 'webgl',
    area: 'toolbox',
    icon: SceneIcon,
    Component: CharacterController,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'characterController-webgpu',
    icon: SceneIcon,
    Component: CharacterController,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    channel: 'webgl',
    area: 'toolbox',
    icon: SceneIcon,
    Component: MultiplayerMadness,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'multiplayerMadness-webgpu',
    icon: SceneIcon,
    Component: MultiplayerMadness,
  },
];
