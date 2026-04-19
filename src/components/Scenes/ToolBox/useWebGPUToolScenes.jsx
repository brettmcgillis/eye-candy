import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const GhostBuster = lazy(() => import('./WebGPU/GhostBuster/GhostBuster'));
const CharacterController = lazy(
  () => import('./WebGPU/CharacterController/CharacterController')
);

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'ghostBuster',
    label: 'Ghost Buster',
    icon: '👻',
    Component: GhostBuster,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: '🏃',
    Component: CharacterController,
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
