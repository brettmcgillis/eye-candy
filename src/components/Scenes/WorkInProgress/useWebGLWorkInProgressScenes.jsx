import { lazy } from 'react';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const BurningAtBothEnds = lazy(
  () => import('./WebGL/BurningAtBothEnds/BurningAtBothEnds')
);
const CrtTest = lazy(() => import('./WebGL/CRTTest/CrtTest'));
const DumpsterFire = lazy(() => import('./WebGL/DumpsterFire/DumpsterFire'));
const ThatsAllFolks = lazy(() => import('./WebGL/ThatsAllFolks/ThatsAllFolks'));
const FlyingHigh = lazy(() => import('./WebGL/FlyingHigh/FlyingHigh'));
const PolicePresence = lazy(
  () => import('./WebGL/PolicePresence/PolicePresence')
);
const StillPullingForYou = lazy(
  () => import('./WebGL/StillPullingForYou/StillPullingForYou')
);
const RowItAlone = lazy(() => import('./WebGL/RowItAlone/RowItAlone'));
const StayingAfloat = lazy(() => import('./WebGL/StayingAfloat/StayingAfloat'));
const QuinnsPlayground = lazy(
  () => import('./WebGL/QuinnsPlayground/QuinnsPlayground')
);
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: '💀',
    Component: NoScene,
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
  {
    id: 'burningAtBothEnds',
    label: 'Burning At Both Ends',
    icon: '🕯️',
    Component: BurningAtBothEnds,
  },
  {
    id: 'thatsAllFolks',
    label: "That's All Folks",
    icon: '🔫💨',
    Component: ThatsAllFolks,
  },
  {
    id: 'flyingHigh',
    label: 'Flying High',
    icon: '✈️',
    Component: FlyingHigh,
  },
  {
    id: 'policePresence',
    label: 'Police Presence',
    icon: '🚓',
    Component: PolicePresence,
  },
  {
    id: 'stillPullingForYou',
    label: 'Still Pulling For You',
    icon: '🚢',
    Component: StillPullingForYou,
  },
  {
    id: 'rowItAlone',
    label: 'Row It Alone',
    icon: '🚣',
    Component: RowItAlone,
  },
  {
    id: 'stayingAfloat',
    label: 'Staying Afloat',
    icon: '🛟',
    Component: StayingAfloat,
  },
  {
    id: 'quinnsPlayground',
    label: "Quinn's Playground",
    icon: '🦭',
    Component: QuinnsPlayground,
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
