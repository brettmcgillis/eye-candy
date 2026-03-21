import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const CrtTest = lazy(() => import('./WebGL/CRTTest/CrtTest'));
const DumpsterFire = lazy(() => import('./WebGL/DumpsterFire/DumpsterFire'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    Component: NoScene,
  },
  {
    id: 'crtTest',
    label: 'CRT Test',
    Component: CrtTest,
  },
  {
    id: 'dumpsterFire',
    label: 'Dumpster Fire',
    Component: DumpsterFire,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGLWorkInProgressScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
