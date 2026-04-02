import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const FoldedFrame = lazy(() => import('./WebGL/FoldedFrame/FoldedFrame'));
const LoGlow = lazy(() => import('./WebGL/LoGlow/LoGlow'));
const AllMyThoughtsAreSoCumulus = lazy(
  () => import('./WebGL/AllMyThoughtsAreSoCumulus/AllMyThoughtsAreSoCumulus')
);
const PaperStack = lazy(() => import('./WebGL/PaperStack/PaperStack'));
const QuinnsDice = lazy(() => import('./WebGL/QuinnsDice/QuinnsDice'));
const Rosie = lazy(() => import('./WebGL/Rosie/Rosie'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
  },
  {
    id: 'foldedFrame',
    label: 'Folded Frame',
    icon: '⬜️◻️▫️',
    Component: FoldedFrame,
  },
  {
    id: 'loGlow',
    label: 'LoGlow',
    icon: '🌑',
    Component: LoGlow,
  },
  {
    id: 'allMyThoughtsAreSoCumulus',
    label: 'All My Thoughts Are So Cumulus',
    icon: '💀☁️',
    Component: AllMyThoughtsAreSoCumulus,
  },
  {
    id: 'paperStack',
    label: 'Paper Stack',
    icon: '📄',
    Component: PaperStack,
  },
  {
    id: 'dice',
    label: "Quinn's Dice",
    icon: '🎲',
    Component: QuinnsDice,
  },
  {
    id: 'rosie',
    label: 'Rosie',
    icon: '❤️🌹',
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
