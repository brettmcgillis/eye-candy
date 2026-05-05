import { lazy } from 'react';
import { PiSkullDuotone } from 'react-icons/pi';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: PiSkullDuotone,
    Component: NoScene,
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
