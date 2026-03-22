import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const BurningAtBothEnds = lazy(
  () => import('./WebGL/BurningAtBothEnds/BurningAtBothEnds')
);
const CrtTest = lazy(() => import('./WebGL/CRTTest/CrtTest'));
const DumpsterFire = lazy(() => import('./WebGL/DumpsterFire/DumpsterFire'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'burningAtBothEnds',
    label: 'Burning At Both Ends',
    icon: '🕯️',
    Component: BurningAtBothEnds,
  },
  {
    id: 'crtTest',
    label: 'CRT Test',
    icon: '📺',
    Component: CrtTest,
  },
  {
    id: 'dumpsterFire',
    label: 'Dumpster Fire',
    icon: '🔥🗑️',
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
