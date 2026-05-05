import { lazy } from 'react';
import { FaCloud, FaHeart, FaMicroscope } from 'react-icons/fa';
import {
  GiDiceEightFacesEight,
  GiDiceTwentyFacesTwenty,
  GiMoonOrbit,
  GiPapers,
  GiRose,
} from 'react-icons/gi';
import { IoDice } from 'react-icons/io5';
import {
  PiBirdDuotone,
  PiDiamondsFourFill,
  PiDiamondsFourThin,
  PiSkullDuotone,
} from 'react-icons/pi';
import { TbSquare } from 'react-icons/tb';

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const Cardinals = lazy(() => import('./WebGL/Cardinals/Cardinals'));
const FoldedFrame = lazy(() => import('./WebGL/FoldedFrame/FoldedFrame'));
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

function FoldedFrameIcon() {
  return (
    <>
      <TbSquare style={{ fontSize: '1em' }} />
      <TbSquare style={{ fontSize: '0.7em' }} />
      <TbSquare style={{ fontSize: '0.45em' }} />
    </>
  );
}
function CumulusIcon() {
  return (
    <>
      <PiSkullDuotone />
      <FaCloud />
    </>
  );
}
function RosieIcon() {
  return (
    <>
      <FaHeart />
      <GiRose />
    </>
  );
}
function DiceIcon() {
  return (
    <>
      <GiDiceEightFacesEight />
      <IoDice />
      <GiDiceTwentyFacesTwenty />
    </>
  );
}
function WatercolorIcon() {
  return (
    <>
      <PiDiamondsFourThin />
      <PiDiamondsFourFill />
      <PiDiamondsFourThin />
    </>
  );
}
function CardinalsIcon() {
  return (
    <>
      <PiBirdDuotone />
      <PiBirdDuotone />
    </>
  );
}
const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'foldedFrame',
    label: 'Folded Frame',
    icon: FoldedFrameIcon,
    Component: FoldedFrame,
  },
  {
    id: 'loGlow',
    label: 'LoGlow',
    icon: GiMoonOrbit,
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
    icon: GiPapers,
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
    icon: FaMicroscope,
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
