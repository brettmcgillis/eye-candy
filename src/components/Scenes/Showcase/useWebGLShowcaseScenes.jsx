import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const FoldedFrame = lazy(() => import('./WebGL/FoldedFrame/FoldedFrame'));
const LoGlow = lazy(() => import('./WebGL/LoGlow/LoGlow'));
const NewScene = lazy(() => import('./WebGL/NewScene/NewScene'));
const PaperStack = lazy(() => import('./WebGL/PaperStack/PaperStack'));
const PenPlotter = lazy(() => import('./WebGL/PenPlotter/PenPlotter'));
const QuinnsDice = lazy(() => import('./WebGL/QuinnsDice/QuinnsDice'));
const Rosie = lazy(() => import('./WebGL/Rosie/Rosie'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    Component: NoScene,
  },
  {
    id: 'foldedFrame',
    label: 'Folded Frame',
    Component: FoldedFrame,
  },
  {
    id: 'loGlow',
    label: 'LoGlow',
    Component: LoGlow,
  },
  {
    id: 'newScene',
    label: 'New Scene',
    Component: NewScene,
  },
  {
    id: 'paperStack',
    label: 'Paper Stack',
    Component: PaperStack,
  },
  {
    id: 'penPlotter',
    label: 'Pen Plotter',
    Component: PenPlotter,
  },
  {
    id: 'dice',
    label: "Quinn's Dice",
    Component: QuinnsDice,
  },
  {
    id: 'rosie',
    label: 'Rosie',
    Component: Rosie,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGLShowcaseScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
