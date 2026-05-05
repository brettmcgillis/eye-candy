import { lazy } from 'react';
import { FaBook, FaFlag, FaGhost } from 'react-icons/fa';
import { PiSkullDuotone } from 'react-icons/pi';
import { GiRabbit } from 'react-icons/gi';

const GhostStoriesIcon = () => <><FaBook /><FaGhost /></>;

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const AllMyFriendsAreGhosts = lazy(
  () => import('./WebGPU/AllMyFriendsAreGhosts/AllMyFriendsAreGhosts')
);
const Surrender = lazy(() => import('./WebGPU/Surrender/Surrender'));
const StayHunted = lazy(() => import('./WebGPU/StayHunted/StayHunted'));
const GhostStories = lazy(() => import('./WebGPU/GhostStories/GhostStories'));
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'allMyFriendsAreGhosts',
    label: 'All My Friends Are Ghosts',
    icon: FaGhost,
    Component: AllMyFriendsAreGhosts,
  },
  {
    id: 'surrender',
    label: 'Surrender',
    icon: FaFlag,
    Component: Surrender,
  },
  {
    id: 'stayHunted',
    label: 'Stay Hunted',
    icon: GiRabbit,
    Component: StayHunted,
  },
  {
    id: 'ghostStories',
    label: 'Ghost Stories',
    icon: GhostStoriesIcon,
    Component: GhostStories,
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
