import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const Ghosts = lazy(() => import('./WebGPU/Ghosts/Ghosts'));
const Surrender = lazy(() => import('./WebGPU/Surrender/Surrender'));
const StayHunted = lazy(() => import('./WebGPU/StayHunted/StayHunted'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'ghosts',
    label: 'Ghosts',
    icon: '👻',
    Component: Ghosts,
  },
  {
    id: 'surrender',
    label: 'Surrender',
    icon: '🏳️',
    Component: Surrender,
  },
  {
    id: 'stayHunted',
    label: 'Stay Hunted',
    icon: '🐇',
    Component: StayHunted,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGPUWorkInProgressScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
