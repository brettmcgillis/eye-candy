import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const MobilePhysicsTest = lazy(
  () => import('./WebGPU/MobilePhysicsTest/MobilePhysicsTest')
);
const NetworkTest = lazy(() => import('./WebGPU/NetworkTest/NetworkTest'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'networkTest',
    label: 'Network Test',
    icon: '🕸️',
    Component: NetworkTest,
  },
  {
    id: 'mobilePhysicsTest',
    label: 'Mobile Physics Test',
    icon: '📱',
    Component: MobilePhysicsTest,
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
