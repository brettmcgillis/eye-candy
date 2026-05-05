import React, { lazy } from 'react';
import { FaPen } from 'react-icons/fa';
import { GiSmokeBomb } from 'react-icons/gi';
import { MdDirectionsRun } from 'react-icons/md';
import { PiSkullDuotone } from 'react-icons/pi';
import { TbVectorSpline } from 'react-icons/tb';

import { iconFile } from '../../../utils/appUtils';

function FireIconImage({ alt = 'Fire' }) {
  return (
    <img
      src={iconFile('fire-icon.svg')}
      alt={alt}
      style={{
        width: 'var(--overlay-icon-size)',
        height: 'var(--overlay-icon-size)',
        verticalAlign: 'middle',
      }}
    />
  );
}

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function FireTestIcon() {
  return <FireIconImage alt="Fire Test" />;
}
function PenPlotterIcon() {
  return <FaPen color="#1e293b" />;
}
function SplineIcon() {
  return <TbVectorSpline color="#a855f7" />;
}
function SmokeTestIcon() {
  return <GiSmokeBomb color="#93c5fd" />;
}
function CharacterControllerIcon() {
  return <MdDirectionsRun color="#10b981" />;
}
function HotBoxIcon() {
  return (
    <>
      <FireIconImage alt="Hot Box" />
      <GiSmokeBomb color="#7dd3fc" />
    </>
  );
}
function MultiplayerIcon() {
  return (
    <>
      <MdDirectionsRun color="#10b981" />
      <MdDirectionsRun color="#6ee7b7" />
    </>
  );
}

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
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    icon: FireTestIcon,
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
    icon: PenPlotterIcon,
    Component: PenPlotter,
  },
  {
    id: 'splineEditor',
    label: 'Spline Editor',
    icon: SplineIcon,
    Component: SplineEditor,
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    icon: SmokeTestIcon,
    Component: SmokeTest,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    icon: CharacterControllerIcon,
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
