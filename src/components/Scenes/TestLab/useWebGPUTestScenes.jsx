import { lazy } from 'react';
import { FaMobileAlt } from 'react-icons/fa';
import { GiSpiderWeb } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';
import { GiSewingNeedle } from 'react-icons/gi';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const MobilePhysicsTest = lazy(
  () => import('./WebGPU/MobilePhysicsTest/MobilePhysicsTest')
);
const NetworkTest = lazy(() => import('./WebGPU/NetworkTest/NetworkTest'));
const TheLoom = lazy(() => import('./WebGPU/TheLoom/TheLoom'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'networkTest',
    label: 'Network Test',
    icon: GiSpiderWeb,
    Component: NetworkTest,
  },
  {
    id: 'mobilePhysicsTest',
    label: 'Mobile Physics Test',
    icon: FaMobileAlt,
    Component: MobilePhysicsTest,
  },
  {
    id: 'theLoom',
    label: 'The Loom',
    icon: GiSewingNeedle,
    Component: TheLoom,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGPUTestScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
