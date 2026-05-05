import { lazy } from 'react';
import { FaGhost } from 'react-icons/fa';
import { PiSkullDuotone } from 'react-icons/pi';
import { MdDirectionsRun } from 'react-icons/md';

const MultiplayerIcon = () => <><MdDirectionsRun /><MdDirectionsRun /></>;

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
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'ghostBuster',
    label: 'Ghost Buster',
    icon: FaGhost,
    Component: GhostBuster,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: MdDirectionsRun,
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
