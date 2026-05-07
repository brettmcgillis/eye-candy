import React, { lazy } from 'react';
import { FaBook, FaGhost } from 'react-icons/fa';
import { GiBlackFlag, GiRabbit, GiSinkingShip } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';

function GhostStoriesIcon() {
  return (
    <>
      <FaBook color="#4f46e5" />
      <FaGhost color="#e2e8f0" />
    </>
  );
}
function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function GhostIcon() {
  return <FaGhost color="#cbd5e1" />;
}
function FlagIcon() {
  return <GiBlackFlag color="#000000" size={24} />;
}
function RabbitIcon() {
  return <GiRabbit color="#d1d5db" />;
}
function TugboatIcon() {
  return <GiSinkingShip color="#1e40af" />;
}

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const AllMyFriendsAreGhosts = lazy(
  () => import('./WebGPU/AllMyFriendsAreGhosts/AllMyFriendsAreGhosts')
);
const Surrender = lazy(() => import('./WebGPU/Surrender/Surrender'));
const StayHunted = lazy(() => import('./WebGPU/StayHunted/StayHunted'));
const GhostStories = lazy(() => import('./WebGPU/GhostStories/GhostStories'));
const StillPullingForYouGPU = lazy(
  () => import('./WebGPU/StillPullingForYou/StillPullingForYou')
);
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'allMyFriendsAreGhosts',
    label: 'All My Friends Are Ghosts',
    icon: GhostIcon,
    Component: AllMyFriendsAreGhosts,
  },
  {
    id: 'surrender',
    label: 'Surrender',
    icon: FlagIcon,
    Component: Surrender,
  },
  {
    id: 'stayHunted',
    label: 'Stay Hunted',
    icon: RabbitIcon,
    Component: StayHunted,
  },
  {
    id: 'ghostStories',
    label: 'Ghost Stories',
    icon: GhostStoriesIcon,
    Component: GhostStories,
  },
  {
    id: 'stillPullingForYou',
    label: 'Still Pulling For You',
    icon: TugboatIcon,
    Component: StillPullingForYouGPU,
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
