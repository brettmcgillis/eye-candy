import React, { lazy } from 'react';
import { GiBlackFlag } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function FlagIcon() {
  return <GiBlackFlag color="#000000" size={24} />;
}
const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const Surrender = lazy(() => import('./WebGPU/Surrender/Surrender'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'surrender',
    label: 'Surrender',
    icon: FlagIcon,
    Component: Surrender,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGPUShowcaseScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
