import React, { lazy } from 'react';
import { FaMobileAlt } from 'react-icons/fa';
import { GiSewingString, GiSpiderWeb } from 'react-icons/gi';
import { PiSkullDuotone } from 'react-icons/pi';

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function NetworkTestIcon() {
  return <GiSpiderWeb color="#94a3b8" />;
}
function MobilePhysicsIcon() {
  return <FaMobileAlt color="#64748b" />;
}
function TheLoomIcon() {
  return <GiSewingString color="#e2e8f0" />;
}

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const MobilePhysicsTest = lazy(
  () => import('./WebGPU/MobilePhysicsTest/MobilePhysicsTest')
);
const NetworkTest = lazy(() => import('./WebGPU/NetworkTest/NetworkTest'));
const TheLoom = lazy(() => import('./WebGPU/TheLoom/TheLoom'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'networkTest',
    label: 'Network Test',
    icon: NetworkTestIcon,
    Component: NetworkTest,
  },
  {
    id: 'mobilePhysicsTest',
    label: 'Mobile Physics Test',
    icon: MobilePhysicsIcon,
    Component: MobilePhysicsTest,
  },
  {
    id: 'theLoom',
    label: 'The Loom',
    icon: TheLoomIcon,
    Component: TheLoom,
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
