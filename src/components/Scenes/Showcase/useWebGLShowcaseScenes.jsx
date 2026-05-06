import React, { lazy } from 'react';
import { FaCloud, FaHeart } from 'react-icons/fa';
import {
  GiCandleLight,
  GiDiceEightFacesEight,
  GiDiceTwentyFacesTwenty,
  GiPapers,
} from 'react-icons/gi';
import { IoDice } from 'react-icons/io5';
import {
  PiBirdDuotone,
  PiDiamondsFourFill,
  PiDiamondsFourThin,
  PiSkullDuotone,
  PiVirusDuotone,
} from 'react-icons/pi';
import { TbSquare } from 'react-icons/tb';

import { iconFile } from '../../../utils/appUtils';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const BurningAtBothEnds = lazy(
  () => import('./WebGL/BurningAtBothEnds/BurningAtBothEnds')
);
const Cardinals = lazy(() => import('./WebGL/Cardinals/Cardinals'));
const PaperCuts = lazy(() => import('./WebGL/PaperCuts/PaperCuts'));
const LoGlow = lazy(() => import('./WebGL/LoGlow/LoGlow'));
const AllMyThoughtsAreSoCumulus = lazy(
  () => import('./WebGL/AllMyThoughtsAreSoCumulus/AllMyThoughtsAreSoCumulus')
);
const Mycelium = lazy(() => import('./WebGL/Mycelium/Mycelium'));
const PaperStack = lazy(() => import('./WebGL/PaperStack/PaperStack'));
const QuinnsDice = lazy(() => import('./WebGL/QuinnsDice/QuinnsDice'));
const Rosie = lazy(() => import('./WebGL/Rosie/Rosie'));
const WatercolorSquares = lazy(
  () => import('./WebGL/WatercolorSquares/WatercolorSquares')
);

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function CandleLightIcon() {
  return <GiCandleLight color="#fbbf24" />;
}
function LoGlowIcon() {
  return (
    <img
      src={iconFile('bret-inner.png')}
      alt="LoGlow"
      style={{
        width: 'auto',
        height: 'calc(var(--overlay-icon-size) * 1.4)',
        verticalAlign: 'middle',
        objectFit: 'contain',
      }}
    />
  );
}
function PaperStackSceneIcon() {
  return <GiPapers color="#111827" />;
}
function MyceliumIcon() {
  return (
    <>
      <PiVirusDuotone color="#9ca3af" />
      <PiVirusDuotone color="#dc2626" style={{ transform: 'rotate(180deg)' }} />
    </>
  );
}

function PaperCutsIcon() {
  return (
    <>
      <TbSquare color="#111827" style={{ fontSize: '1em' }} />
      <TbSquare color="#374151" style={{ fontSize: '0.7em' }} />
      <TbSquare color="#6b7280" style={{ fontSize: '0.45em' }} />
    </>
  );
}
function CumulusIcon() {
  return (
    <>
      <PiSkullDuotone color="#94a3b8" />
      <FaCloud color="#7dd3fc" />
    </>
  );
}
function RosieIcon() {
  return (
    <>
      <FaHeart color="#f43f5e" />
      <img
        src={iconFile('rose.png')}
        alt="Rosie"
        style={{
          width: 'var(--overlay-icon-size)',
          height: 'var(--overlay-icon-size)',
          verticalAlign: 'middle',
        }}
      />
    </>
  );
}
function DiceIcon() {
  return (
    <>
      <GiDiceEightFacesEight color="#dc2626" />
      <IoDice color="#3b82f6" />
      <GiDiceTwentyFacesTwenty color="#ec4899" />
    </>
  );
}
function WatercolorIcon() {
  return (
    <>
      <PiDiamondsFourThin color="#111827" />
      <PiDiamondsFourFill color="#374151" />
      <PiDiamondsFourThin color="#111827" />
    </>
  );
}
function CardinalsIcon() {
  return (
    <>
      <PiBirdDuotone color="#dc2626" />
      <PiBirdDuotone color="#ef4444" />
    </>
  );
}
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'burningAtBothEnds',
    label: 'Burning At Both Ends',
    icon: CandleLightIcon,
    Component: BurningAtBothEnds,
  },
  {
    id: 'paperCuts',
    label: 'Paper Cuts',
    icon: PaperCutsIcon,
    Component: PaperCuts,
  },
  {
    id: 'loGlow',
    label: 'LoGlow',
    icon: LoGlowIcon,
    Component: LoGlow,
  },
  {
    id: 'allMyThoughtsAreSoCumulus',
    label: 'All My Thoughts Are So Cumulus',
    icon: CumulusIcon,
    Component: AllMyThoughtsAreSoCumulus,
  },
  {
    id: 'paperStack',
    label: 'Paper Stack',
    icon: PaperStackSceneIcon,
    Component: PaperStack,
  },
  {
    id: 'dice',
    label: "Quinn's Dice",
    icon: DiceIcon,
    Component: QuinnsDice,
  },
  {
    id: 'mycelium',
    label: 'Mycelium',
    icon: MyceliumIcon,
    Component: Mycelium,
  },
  {
    id: 'rosie',
    label: 'Rosie',
    icon: RosieIcon,
    Component: Rosie,
  },
  {
    id: 'cardinals',
    label: 'Cardinals',
    icon: CardinalsIcon,
    Component: Cardinals,
  },
  {
    id: 'watercolorSquares',
    label: 'Watercolor Squares',
    icon: WatercolorIcon,
    Component: WatercolorSquares,
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
