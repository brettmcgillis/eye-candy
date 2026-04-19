import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const FireTest = lazy(() => import('./WebGL/FireTest/FireTest'));
const HotBox = lazy(() => import('./WebGL/HotBox/HotBox'));
const PenPlotter = lazy(() => import('./WebGL/PenPlotter/PenPlotter'));
const SplineEditor = lazy(() => import('./WebGL/SplineEditor/SplineEditor'));
const SmokeTest = lazy(() => import('./WebGL/SmokeTest/SmokeTest'));
const CharacterController = lazy(
  () => import('./WebGPU/CharacterController/CharacterController')
);
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    icon: '🔥',
    Component: FireTest,
  },
  {
    id: 'hotBox',
    label: 'Hot Box',
    icon: '🔥💨',
    Component: HotBox,
  },
  {
    id: 'penPlotter',
    label: 'Pen Plotter',
    icon: '🖊️',
    Component: PenPlotter,
  },
  {
    id: 'splineEditor',
    label: 'Spline Editor',
    icon: '➰',
    Component: SplineEditor,
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    icon: '💨',
    Component: SmokeTest,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: '🏃',
    Component: CharacterController,
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
