import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const AllMyFriendsAreGhosts = lazy(
  () => import('./WebGPU/AllMyFriendsAreGhosts/AllMyFriendsAreGhosts')
);
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
    id: 'allMyFriendsAreGhosts',
    label: 'All My Friends Are Ghosts',
    icon: '👻',
    Component: AllMyFriendsAreGhosts,
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
