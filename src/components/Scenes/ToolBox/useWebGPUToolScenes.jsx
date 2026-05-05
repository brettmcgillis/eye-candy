import React, { lazy } from 'react';
import { FaGhost } from 'react-icons/fa';
import { MdDirectionsRun } from 'react-icons/md';
import { PiSkullDuotone } from 'react-icons/pi';

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function GhostBusterIcon() {
  return <FaGhost color="#cbd5e1" />;
}
function CharacterControllerIcon() {
  return <MdDirectionsRun color="#10b981" />;
}
function MultiplayerIcon() {
  return (
    <>
      <MdDirectionsRun color="#10b981" />
      <MdDirectionsRun color="#6ee7b7" />
    </>
  );
}

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const GhostBuster = lazy(() => import('./WebGPU/GhostBuster/GhostBuster'));
const CharacterController = lazy(
  () => import('./WebGPU/CharacterController/CharacterController')
);
const MultiplayerMadness = lazy(
  () => import('./WebGPU/MultiplayerMadness/MultiplayerMadness')
);

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'ghostBuster',
    label: 'Ghost Buster',
    icon: GhostBusterIcon,
    Component: GhostBuster,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: CharacterControllerIcon,
    Component: CharacterController,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    icon: MultiplayerIcon,
    Component: MultiplayerMadness,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGPUToolScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
