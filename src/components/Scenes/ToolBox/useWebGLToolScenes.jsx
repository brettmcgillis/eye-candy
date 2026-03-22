import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const SplineEditor = lazy(
  () => import('./WebGL/SplineEditor/components/SplineEditor')
);

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'splineEditor',
    label: 'Spline Editor',
    icon: '〰️',
    Component: SplineEditor,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGLToolScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
