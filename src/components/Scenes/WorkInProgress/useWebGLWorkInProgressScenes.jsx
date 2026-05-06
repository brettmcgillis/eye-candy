import React, { lazy } from 'react';
import { FaPaw, FaPlane } from 'react-icons/fa';
import {
  GiPaperBoat,
  GiPistolGun,
  GiPoliceBadge,
  GiSinkingShip,
} from 'react-icons/gi';
import { ImLifebuoy } from 'react-icons/im';
import { LiaDumpsterFireSolid } from 'react-icons/lia';
import { PiSkullDuotone } from 'react-icons/pi';
import { TbDeviceTvOldFilled } from 'react-icons/tb';
import { WiSmoke } from 'react-icons/wi';

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function CrtTestIcon() {
  return <TbDeviceTvOldFilled color="#111827" />;
}
function DumpsterFireIcon() {
  return <LiaDumpsterFireSolid color="#111827" />;
}
function FlyingHighIcon() {
  return <FaPlane color="#111827" />;
}
function PoliceBadgeIcon() {
  return <GiPoliceBadge color="#111827" />;
}
function SinkingShipIcon() {
  return <GiSinkingShip color="#1e40af" />;
}
function PaperBoatIcon() {
  return <GiPaperBoat color="#93c5fd" />;
}
function LifebuoyIcon() {
  return <ImLifebuoy color="#ef4444" />;
}
function PawIcon() {
  return <FaPaw color="#a78bfa" />;
}
function ThatsAllFolksIcon() {
  return (
    <>
      <GiPistolGun color="#374151" />
      <WiSmoke color="#9ca3af" />
    </>
  );
}

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
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
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'crtTest',
    label: 'CRT Test',
    icon: CrtTestIcon,
    Component: CrtTest,
  },
  {
    id: 'dumpsterFire',
    label: 'Dumpster Fire',
    icon: DumpsterFireIcon,
    Component: DumpsterFire,
  },
  {
    id: 'thatsAllFolks',
    label: "That's All Folks",
    icon: ThatsAllFolksIcon,
    Component: ThatsAllFolks,
  },
  {
    id: 'flyingHigh',
    label: 'Flying High',
    icon: FlyingHighIcon,
    Component: FlyingHigh,
  },
  {
    id: 'policePresence',
    label: 'Police Presence',
    icon: PoliceBadgeIcon,
    Component: PolicePresence,
  },
  {
    id: 'stillPullingForYou',
    label: 'Still Pulling For You',
    icon: SinkingShipIcon,
    Component: StillPullingForYou,
  },
  {
    id: 'rowItAlone',
    label: 'Row It Alone',
    icon: PaperBoatIcon,
    Component: RowItAlone,
  },
  {
    id: 'stayingAfloat',
    label: 'Staying Afloat',
    icon: LifebuoyIcon,
    Component: StayingAfloat,
  },
  {
    id: 'quinnsPlayground',
    label: "Quinn's Playground",
    icon: PawIcon,
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
