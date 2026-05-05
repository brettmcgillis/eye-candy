import { lazy } from 'react';
import { FaFire, FaPen, FaWind } from 'react-icons/fa';
import { PiSkullDuotone } from 'react-icons/pi';
import { MdDirectionsRun } from 'react-icons/md';
import { TbVectorSpline } from 'react-icons/tb';

const HotBoxIcon = () => <><FaFire /><FaWind /></>;
const MultiplayerIcon = () => <><MdDirectionsRun /><MdDirectionsRun /></>;

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const FireTest = lazy(() => import('./WebGL/FireTest/FireTest'));
const HotBox = lazy(() => import('./WebGL/HotBox/HotBox'));
const PenPlotter = lazy(() => import('./WebGL/PenPlotter/PenPlotter'));
const SplineEditor = lazy(() => import('./WebGL/SplineEditor/SplineEditor'));
const SmokeTest = lazy(() => import('./WebGL/SmokeTest/SmokeTest'));
const CharacterController = lazy(
  () => import('./WebGL/CharacterController/CharacterController')
);
const MultiplayerMadness = lazy(
  () => import('./WebGL/MultiplayerMadness/MultiplayerMadness')
);
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    icon: FaFire,
    Component: FireTest,
  },
  {
    id: 'hotBox',
    label: 'Hot Box',
    icon: HotBoxIcon,
    Component: HotBox,
  },
  {
    id: 'penPlotter',
    label: 'Pen Plotter',
    icon: FaPen,
    Component: PenPlotter,
  },
  {
    id: 'splineEditor',
    label: 'Spline Editor',
    icon: TbVectorSpline,
    Component: SplineEditor,
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    icon: FaWind,
    Component: SmokeTest,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: MdDirectionsRun,
    Component: CharacterController,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    icon: MultiplayerIcon,
    Component: MultiplayerMadness,
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
