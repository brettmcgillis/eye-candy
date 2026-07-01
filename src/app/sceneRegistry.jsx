import React, { lazy } from 'react';
import { BiSolidInvader } from 'react-icons/bi';
import { BsLightningFill } from 'react-icons/bs';
import {
  FaBomb,
  FaBone,
  FaBook,
  FaCloud,
  FaFlask,
  FaGhost,
  FaHandPaper,
  FaHeart,
  FaMobileAlt,
  FaMusic,
  FaPaw,
  FaPen,
  FaPlane,
  FaPrayingHands,
  FaSkullCrossbones,
  FaToolbox,
} from 'react-icons/fa';
import { FcFullTrash } from 'react-icons/fc';
import {
  GiAquarium,
  GiAtomCore,
  GiBlackFlag,
  GiCandleLight,
  GiCctvCamera,
  GiDiceEightFacesEight,
  GiDiceTwentyFacesTwenty,
  GiHorseHead,
  GiHummingbird,
  GiMoneyStack,
  GiPaperBoat,
  GiPapers,
  GiPistolGun,
  GiPoliceBadge,
  GiRabbit,
  GiRaccoonHead,
  GiRibcage,
  GiSewingString,
  GiSinkingShip,
  GiSmokeBomb,
  GiSpiderWeb,
} from 'react-icons/gi';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { ImLifebuoy } from 'react-icons/im';
import { IoDice } from 'react-icons/io5';
import { LiaDumpsterFireSolid } from 'react-icons/lia';
import { MdDirectionsRun } from 'react-icons/md';
import {
  PiBirdDuotone,
  PiDiamondsFourFill,
  PiDiamondsFourThin,
  PiHairDryerDuotone,
  PiPlanetFill,
  PiSkullDuotone,
  PiVirusDuotone,
} from 'react-icons/pi';
import {
  TbAtom2Filled,
  TbDeviceTvOldFilled,
  TbSquare,
  TbVectorSpline,
} from 'react-icons/tb';
import { WiSmoke } from 'react-icons/wi';

import { iconFile } from '../utils/appUtils';

const NoScene = lazy(() => import('./scaffold/NoScene'));

const BurningAtBothEnds = lazy(
  () =>
    import('../components/scenes/Showcase/WebGL/BurningAtBothEnds/BurningAtBothEnds')
);
const Cardinals = lazy(
  () => import('../components/scenes/Showcase/WebGL/Cardinals/Cardinals')
);
const PaperCuts = lazy(
  () => import('../components/scenes/Showcase/WebGL/PaperCuts/PaperCuts')
);
const LoGlow = lazy(
  () => import('../components/scenes/Showcase/WebGL/LoGlow/LoGlow')
);
const AllMyThoughtsAreSoCumulus = lazy(
  () =>
    import('../components/scenes/Showcase/WebGL/AllMyThoughtsAreSoCumulus/AllMyThoughtsAreSoCumulus')
);
const Mycelium = lazy(
  () => import('../components/scenes/Showcase/WebGL/Mycelium/Mycelium')
);
const PaperStack = lazy(
  () => import('../components/scenes/Showcase/WebGL/PaperStack/PaperStack')
);
const QuinnsDice = lazy(
  () => import('../components/scenes/Showcase/WebGL/QuinnsDice/QuinnsDice')
);
const Rosie = lazy(
  () => import('../components/scenes/Showcase/WebGL/Rosie/Rosie')
);
const WatercolorSquares = lazy(
  () =>
    import('../components/scenes/Showcase/WebGL/WatercolorSquares/WatercolorSquares')
);
const Surrender = lazy(
  () => import('../components/scenes/Showcase/WebGPU/Surrender/Surrender')
);

const ExplosionTest = lazy(
  () => import('../components/scenes/TestLab/WebGL/ExplosionTest/ExplosionTest')
);
const FluidTest = lazy(
  () => import('../components/scenes/TestLab/WebGL/FluidTest/FluidTest')
);
const FurLabWebGL = lazy(
  () => import('../components/scenes/TestLab/WebGL/FurLab/FurLab')
);
const HandStuff = lazy(
  () => import('../components/scenes/TestLab/WebGL/HandStuff/HandStuff')
);
const TheBoneZone = lazy(
  () => import('../components/scenes/TestLab/WebGL/TheBoneZone/TheBoneZone')
);
const ParticleLab = lazy(
  () => import('../components/scenes/TestLab/WebGL/ParticleLab/ParticleLab')
);
const PixelHater = lazy(
  () => import('../components/scenes/TestLab/WebGL/PixelHater/PixelHater')
);
const StrudelDoodle = lazy(
  () => import('../components/scenes/TestLab/WebGL/StrudelDoodle/StrudelDoodle')
);
const LightningLabWebGL = lazy(
  () => import('../components/scenes/TestLab/WebGL/LightningLab/LightningLab')
);
const MobilePhysicsTest = lazy(
  () =>
    import('../components/scenes/TestLab/WebGPU/MobilePhysicsTest/MobilePhysicsTest')
);
const NetworkTest = lazy(
  () => import('../components/scenes/TestLab/WebGPU/NetworkTest/NetworkTest')
);
const TheLoom = lazy(
  () => import('../components/scenes/TestLab/WebGPU/TheLoom/TheLoom')
);
const LightningLabWebGPU = lazy(
  () => import('../components/scenes/TestLab/WebGPU/LightningLab/LightningLab')
);
const FurLabWebGPU = lazy(
  () => import('../components/scenes/TestLab/WebGPU/FurLab/FurLab')
);

const FireTest = lazy(
  () => import('../components/scenes/ToolBox/FireTest/FireTest')
);
const HotBox = lazy(() => import('../components/scenes/ToolBox/HotBox/HotBox'));
const CrtTestWebGL = lazy(
  () => import('../components/scenes/ToolBox/WebGL/CRTTest/CRTTest')
);
const PenPlotter = lazy(
  () => import('../components/scenes/ToolBox/WebGL/PenPlotter/PenPlotter')
);
const SplineEditor = lazy(
  () => import('../components/scenes/ToolBox/WebGL/SplineEditor/SplineEditor')
);
const TrashCollector = lazy(
  () =>
    import('../components/scenes/ToolBox/WebGL/TrashCollector/TrashCollector')
);
const SmokeTest = lazy(
  () => import('../components/scenes/ToolBox/SmokeTest/SmokeTest')
);
const CharacterControllerWebGL = lazy(
  () =>
    import('../components/scenes/ToolBox/WebGL/CharacterController/CharacterController')
);
const MultiplayerMadnessWebGL = lazy(
  () =>
    import('../components/scenes/ToolBox/WebGL/MultiplayerMadness/MultiplayerMadness')
);
const GhostBuster = lazy(
  () => import('../components/scenes/ToolBox/WebGPU/GhostBuster/GhostBuster')
);
const CrtTestWebGPU = lazy(
  () => import('../components/scenes/ToolBox/WebGPU/CRTTest/CRTTest')
);
const CharacterControllerWebGPU = lazy(
  () =>
    import('../components/scenes/ToolBox/WebGPU/CharacterController/CharacterController')
);
const MultiplayerMadnessWebGPU = lazy(
  () =>
    import('../components/scenes/ToolBox/WebGPU/MultiplayerMadness/MultiplayerMadness')
);

const DumpsterFire = lazy(
  () => import('../components/scenes/Showcase/WebGL/DumpsterFire/DumpsterFire')
);
const RaisedByTV = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/RaisedByTV/RaisedByTV')
);
const Aisle9 = lazy(
  () => import('../components/scenes/WorkInProgress/WebGPU/Aisle9/Aisle9')
);

const RowItAloneWebGPU = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/RowItAlone/RowItAlone')
);
const ThatsAllFolksWebGPU = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/ThatsAllFolks/ThatsAllFolks')
);
const FlyingHigh = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGL/FlyingHigh/FlyingHigh')
);
const PolicePresence = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGL/PolicePresence/PolicePresence')
);
const RowItAlone = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGL/RowItAlone/RowItAlone')
);
const StayingAfloat = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGL/StayingAfloat/StayingAfloat')
);
const QuinnsPlayground = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGL/QuinnsPlayground/QuinnsPlayground')
);
const AllMyFriendsAreGhosts = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/AllMyFriendsAreGhosts/AllMyFriendsAreGhosts')
);
const StayHunted = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/StayHunted/StayHunted')
);
const GhostStories = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/GhostStories/GhostStories')
);
const MyHeartIsABrokenFishTank = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/MyHeartIsABrokenFishTank/MyHeartIsABrokenFishTank')
);
const StillPullingForYouWebGPU = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/StillPullingForYou/StillPullingForYou')
);

const HorsesForCourses = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/HorsesForCourses/HorsesForCourses')
);

const DrippingSkull = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/DrippingSkull/DrippingSkull')
);
const BurningCash = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/BurningCash/BurningCash')
);
const UrbanWildlife = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/UrbanWildlife/UrbanWildlife')
);
const BirdsArentReal = lazy(
  () =>
    import('../components/scenes/Showcase/WebGPU/BirdsArentReal/BirdsArentReal')
);

const BeautysInTheEyeOfTheBeheaded = lazy(
  () =>
    import('../components/scenes/Showcase/WebGPU/BeautysInTheEyeOfTheBeheaded/BeautysInTheEyeOfTheBeheaded')
);

const OneInTheHand = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/OneInTheHand/OneInTheHand')
);
const Prayer = lazy(
  () => import('../components/scenes/WorkInProgress/WebGPU/Prayer/Prayer')
);
const Apparitions = lazy(
  () =>
    import('../components/scenes/WorkInProgress/WebGPU/Apparitions/Apparitions')
);

function WipAreaIcon() {
  return <HiOutlineWrenchScrewdriver color="#000000" size={24} />;
}

function TestlabAreaIcon() {
  return <FaFlask color="#22c55e" />;
}

function ToolboxAreaIcon() {
  return <FaToolbox color="#dc2626" />;
}

function NoSceneIcon() {
  return <PiSkullDuotone color="#2b2b2b" />;
}

function CandleLightIcon() {
  return <GiCandleLight color="#fbbf24" />;
}

function FlagIcon() {
  return <GiBlackFlag color="#000000" size={24} />;
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

function FluidTestIcon() {
  return <ImLifebuoy color="#ef4444" />;
}

function FurLabIcon() {
  return <PiHairDryerDuotone color="#a78bfa" />;
}

function HandStuffIcon() {
  return <FaHandPaper color="#fbbf24" />;
}

function TheBoneZoneIcon() {
  return <FaBone color="#e2e8f0" />;
}

function PixelHaterIcon() {
  return <BiSolidInvader color="#a855f7" />;
}

function ParticleLabIcon() {
  return <GiAtomCore color="#991b1b" />;
}

function StrudelDoodleIcon() {
  return <FaMusic color="#e879f9" />;
}

function ExplosionIcon() {
  return <FaBomb color="#374151" />;
}

function LightningLabIcon() {
  return (
    <>
      <BsLightningFill color="#fef08a" />
      <BsLightningFill color="#fde047" />
      <BsLightningFill color="#f59e0b" />
    </>
  );
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
  return <GiSmokeBomb color="#373839" />;
}

function TrashCollectorIcon() {
  return <FcFullTrash />;
}

function CharacterControllerIcon() {
  return <MdDirectionsRun color="#10b981" />;
}

function HotBoxIcon() {
  return (
    <>
      <FireIconImage alt="Hot Box" />
      <GiSmokeBomb color="#373839" />
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

function GhostBusterIcon() {
  return <FaGhost color="#cbd5e1" />;
}

function CrtTestIcon() {
  return <TbDeviceTvOldFilled color="#111827" />;
}

function DumpsterFireIcon() {
  return <LiaDumpsterFireSolid color="#111827" size={25} />;
}

function FlyingHighIcon() {
  return <FaPlane color="#111827" />;
}

function PoliceBadgeIcon() {
  return <GiPoliceBadge color="#111827" />;
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

function GhostStoriesIcon() {
  return (
    <>
      <FaBook color="#4f46e5" />
      <FaGhost color="#e2e8f0" />
    </>
  );
}

function BrokenFishTankIcon() {
  return <GiAquarium color="#00125a" size={26} />;
}

function GhostIcon() {
  return <FaGhost color="#cbd5e1" />;
}

function Aisle9Icon() {
  return <PiPlanetFill color="#202020" />;
}

function RabbitIcon() {
  return <GiRabbit color="#d1d5db" />;
}

function TugboatIcon() {
  return <GiSinkingShip color="#1e40af" />;
}

function BeautysInTheEyeOfTheBeheadedIcon() {
  return <FaSkullCrossbones color="#111827" />;
}

function HorsesForCoursesIcon() {
  return <GiHorseHead color="#b87333" />;
}

function DrippingSkullIcon() {
  return <FaSkullCrossbones color="#e5e7eb" />;
}

function BurningCashIcon() {
  return <GiMoneyStack color="#328304" size={26} />;
}

function UrbanWildlifeIcon() {
  return <GiRaccoonHead color="#000000" size={26} />;
}

function BirdsArentRealIcon() {
  return <GiCctvCamera color="#000000" size={26} />;
}

function OneInTheHandIcon() {
  return (
    <>
      <GiHummingbird color="#24a8fb" />
      <GiRibcage color="#808a99" size={26} />
    </>
  );
}

function PrayerIcon() {
  return <FaPrayingHands color="#710000" />;
}

function ApparitionsIcon() {
  return <TbAtom2Filled color="#6a00a2" size={26} />;
}

export const AREA_ROUTE_SEGMENTS = {
  showcase: '',
  testlab: 'testlab',
  toolbox: 'toolbox',
  wip: 'wip',
};

const AREA_SEGMENT_TO_KEY = Object.fromEntries(
  Object.entries(AREA_ROUTE_SEGMENTS)
    .filter(([, segment]) => segment)
    .map(([area, segment]) => [segment, area])
);

export const DEFAULT_SCENE_PATH = '/loGlow';

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;

  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

function createRegistryShape(createValue = () => []) {
  return {
    webgl: {
      showcase: createValue(),
      wip: createValue(),
      testlab: createValue(),
      toolbox: createValue(),
    },
    webgpu: {
      showcase: createValue(),
      wip: createValue(),
      testlab: createValue(),
      toolbox: createValue(),
    },
  };
}

function getSceneKey(channel, area, sceneId) {
  return `${channel}:${area}:${sceneId}`;
}

function getScenePath(area, route) {
  const areaSegment = AREA_ROUTE_SEGMENTS[area];
  return areaSegment ? `/${areaSegment}/${route}` : `/${route}`;
}

function pickDefaultScene(scenes) {
  return (
    scenes.find((scene) => scene.id === 'loGlow') ||
    scenes.find((scene) => scene.id !== 'noScene') ||
    scenes[0] ||
    null
  );
}

function buildSceneRegistry(items) {
  const byArea = createRegistryShape();
  const byPath = {};
  const byLegacyId = {};
  const bySceneKey = {};
  const areaDefaults = createRegistryShape(() => null);

  items.forEach((item) => {
    const baseRoute = item.route ?? item.id;
    let route = baseRoute;
    let path = getScenePath(item.area, route);
    let suffixIndex = 2;

    while (byPath[path]) {
      route = `${baseRoute}-${suffixIndex}`;
      path = getScenePath(item.area, route);
      suffixIndex += 1;
    }

    const sceneRecord = {
      ...item,
      name: item.label,
      route,
      path,
    };

    byArea[item.channel][item.area].push(sceneRecord);
    byPath[path] = sceneRecord;
    bySceneKey[getSceneKey(item.channel, item.area, item.id)] = sceneRecord;

    if (!byLegacyId[item.id]) {
      byLegacyId[item.id] = sceneRecord;
    }
  });

  Object.entries(byArea).forEach(([channel, areas]) => {
    Object.entries(areas).forEach(([area, scenes]) => {
      scenes.sort(compareScenes);
      areaDefaults[channel][area] = pickDefaultScene(scenes);
    });
  });

  const defaultScene =
    bySceneKey[getSceneKey('webgl', 'showcase', 'loGlow')] ||
    pickDefaultScene(byArea.webgl.showcase);

  return {
    byArea,
    byPath,
    byLegacyId,
    bySceneKey,
    areaDefaults,
    defaultScene,
  };
}

export const CHANNELS = {
  webgl: 'WebGL',
  webgpu: 'WebGPU',
};

export const AREAS = {
  showcase: 'Showcase',
  wip: 'Work in Progress',
  testlab: 'Test Lab',
  toolbox: 'Toolbox',
};

export const AREA_ICONS = {
  showcase: null,
  wip: WipAreaIcon,
  testlab: TestlabAreaIcon,
  toolbox: ToolboxAreaIcon,
};

export const EYE_CANDIES = [
  {
    id: 'noScene',
    label: 'None',
    channel: 'webgl',
    area: 'showcase',
    route: 'noScene',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'burningAtBothEnds',
    label: 'Burning At Both Ends',
    channel: 'webgl',
    area: 'showcase',
    route: 'burningAtBothEnds',
    icon: CandleLightIcon,
    Component: BurningAtBothEnds,
  },
  {
    id: 'paperCuts',
    label: 'Paper Cuts',
    channel: 'webgl',
    area: 'showcase',
    route: 'paperCuts',
    icon: PaperCutsIcon,
    Component: PaperCuts,
  },
  {
    id: 'loGlow',
    label: 'LoGlow',
    channel: 'webgl',
    area: 'showcase',
    route: 'loGlow',
    icon: LoGlowIcon,
    Component: LoGlow,
  },
  {
    id: 'allMyThoughtsAreSoCumulus',
    label: 'All My Thoughts Are So Cumulus',
    channel: 'webgl',
    area: 'showcase',
    route: 'allMyThoughtsAreSoCumulus',
    icon: CumulusIcon,
    Component: AllMyThoughtsAreSoCumulus,
  },
  {
    id: 'paperStack',
    label: 'Paper Stack',
    channel: 'webgl',
    area: 'showcase',
    route: 'paperStack',
    icon: PaperStackSceneIcon,
    Component: PaperStack,
  },
  {
    id: 'dice',
    label: "Quinn's Dice",
    channel: 'webgl',
    area: 'showcase',
    route: 'dice',
    icon: DiceIcon,
    Component: QuinnsDice,
  },
  {
    id: 'mycelium',
    label: 'Mycelium',
    channel: 'webgl',
    area: 'showcase',
    route: 'mycelium',
    icon: MyceliumIcon,
    Component: Mycelium,
  },
  {
    id: 'rosie',
    label: 'Rosie',
    channel: 'webgl',
    area: 'showcase',
    route: 'rosie',
    icon: RosieIcon,
    Component: Rosie,
  },
  {
    id: 'cardinals',
    label: 'Cardinals',
    channel: 'webgl',
    area: 'showcase',
    route: 'cardinals',
    icon: CardinalsIcon,
    Component: Cardinals,
  },
  {
    id: 'watercolorSquares',
    label: 'Watercolor Squares',
    channel: 'webgl',
    area: 'showcase',
    route: 'watercolorSquares',
    icon: WatercolorIcon,
    Component: WatercolorSquares,
  },
  {
    id: 'noScene',
    label: 'None',
    channel: 'webgpu',
    area: 'showcase',
    route: 'noScene-webgpu',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'surrender',
    label: 'Surrender',
    channel: 'webgpu',
    area: 'showcase',
    route: 'surrender',
    icon: FlagIcon,
    Component: Surrender,
  },

  {
    id: 'noScene',
    label: 'None',
    channel: 'webgl',
    area: 'testlab',
    route: 'noScene',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'fluidTest',
    label: 'Fluid Test',
    channel: 'webgl',
    area: 'testlab',
    route: 'fluidTest',
    icon: FluidTestIcon,
    Component: FluidTest,
  },
  {
    id: 'furLab',
    label: 'Fur Lab',
    channel: 'webgl',
    area: 'testlab',
    route: 'furLab',
    icon: FurLabIcon,
    Component: FurLabWebGL,
  },
  {
    id: 'lightningLab',
    label: 'Lightning Lab',
    channel: 'webgl',
    area: 'testlab',
    route: 'lightningLab',
    icon: LightningLabIcon,
    Component: LightningLabWebGL,
  },
  {
    id: 'handStuff',
    label: 'Hand Stuff',
    channel: 'webgl',
    area: 'testlab',
    route: 'handStuff',
    icon: HandStuffIcon,
    Component: HandStuff,
  },
  {
    id: 'theBoneZone',
    label: 'TheBoneZone',
    channel: 'webgl',
    area: 'testlab',
    route: 'theBoneZone',
    icon: TheBoneZoneIcon,
    Component: TheBoneZone,
  },
  {
    id: 'pixelHater',
    label: 'PixelHater',
    channel: 'webgl',
    area: 'testlab',
    route: 'pixelHater',
    icon: PixelHaterIcon,
    Component: PixelHater,
  },
  {
    id: 'particleLab',
    label: 'Particle Lab',
    channel: 'webgl',
    area: 'testlab',
    route: 'particleLab',
    icon: ParticleLabIcon,
    Component: ParticleLab,
  },
  {
    id: 'strudelDoodle',
    label: 'StrudelDoodle',
    channel: 'webgl',
    area: 'testlab',
    route: 'strudelDoodle',
    icon: StrudelDoodleIcon,
    Component: StrudelDoodle,
  },
  {
    id: 'explosionTest',
    label: 'Explosion Test',
    channel: 'webgl',
    area: 'testlab',
    route: 'explosionTest',
    icon: ExplosionIcon,
    Component: ExplosionTest,
  },
  {
    id: 'noScene',
    label: 'None',
    channel: 'webgpu',
    area: 'testlab',
    route: 'noScene-webgpu',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'networkTest',
    label: 'Network Test',
    channel: 'webgpu',
    area: 'testlab',
    route: 'networkTest',
    icon: NetworkTestIcon,
    Component: NetworkTest,
  },
  {
    id: 'furLab',
    label: 'Fur Lab',
    channel: 'webgpu',
    area: 'testlab',
    route: 'furLabWebgpu',
    icon: FurLabIcon,
    Component: FurLabWebGPU,
  },
  {
    id: 'lightningLab',
    label: 'Lightning Lab',
    channel: 'webgpu',
    area: 'testlab',
    route: 'lightningLab',
    icon: LightningLabIcon,
    Component: LightningLabWebGPU,
  },
  {
    id: 'mobilePhysicsTest',
    label: 'Mobile Physics Test',
    channel: 'webgpu',
    area: 'testlab',
    route: 'mobilePhysicsTest',
    icon: MobilePhysicsIcon,
    Component: MobilePhysicsTest,
  },
  {
    id: 'theLoom',
    label: 'The Loom',
    channel: 'webgpu',
    area: 'testlab',
    route: 'theLoom',
    icon: TheLoomIcon,
    Component: TheLoom,
  },

  {
    id: 'noScene',
    label: 'None',
    channel: 'webgl',
    area: 'toolbox',
    route: 'noScene',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    channel: 'webgl',
    area: 'toolbox',
    route: 'fireTest',
    icon: FireTestIcon,
    Component: FireTest,
  },
  {
    id: 'hotBox',
    label: 'Hot Box',
    channel: 'webgl',
    area: 'toolbox',
    route: 'hotBox',
    icon: HotBoxIcon,
    Component: HotBox,
  },
  {
    id: 'crtTest',
    label: 'CRT Test',
    channel: 'webgl',
    area: 'toolbox',
    route: 'crtTest',
    icon: CrtTestIcon,
    Component: CrtTestWebGL,
  },
  {
    id: 'penPlotter',
    label: 'Pen Plotter',
    channel: 'webgl',
    area: 'toolbox',
    route: 'penPlotter',
    icon: PenPlotterIcon,
    Component: PenPlotter,
  },
  {
    id: 'splineEditor',
    label: 'Spline Editor',
    channel: 'webgl',
    area: 'toolbox',
    route: 'splineEditor',
    icon: SplineIcon,
    Component: SplineEditor,
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    channel: 'webgl',
    area: 'toolbox',
    route: 'smokeTest',
    icon: SmokeTestIcon,
    Component: SmokeTest,
  },
  {
    id: 'trashcollector',
    label: 'TrashCollector',
    channel: 'webgl',
    area: 'toolbox',
    route: 'trashcollector',
    icon: TrashCollectorIcon,
    Component: TrashCollector,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    channel: 'webgl',
    area: 'toolbox',
    route: 'characterController',
    icon: CharacterControllerIcon,
    Component: CharacterControllerWebGL,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    channel: 'webgl',
    area: 'toolbox',
    route: 'multiplayerMadness',
    icon: MultiplayerIcon,
    Component: MultiplayerMadnessWebGL,
  },
  {
    id: 'noScene',
    label: 'None',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'noScene-webgpu',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'fireTest-webgpu',
    icon: FireTestIcon,
    Component: FireTest,
  },
  {
    id: 'hotBox',
    label: 'Hot Box',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'hotBox-webgpu',
    icon: HotBoxIcon,
    Component: HotBox,
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'smokeTest-webgpu',
    icon: SmokeTestIcon,
    Component: SmokeTest,
  },
  {
    id: 'ghostBuster',
    label: 'Ghost Buster',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'ghostBuster',
    icon: GhostBusterIcon,
    Component: GhostBuster,
  },
  {
    id: 'crtTest',
    label: 'CRT Test',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'crtTest-webgpu',
    icon: CrtTestIcon,
    Component: CrtTestWebGPU,
  },
  {
    id: 'characterController',
    label: 'Character Controller',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'characterController-webgpu',
    icon: CharacterControllerIcon,
    Component: CharacterControllerWebGPU,
  },
  {
    id: 'multiplayerMadness',
    label: 'Multiplayer Madness',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'multiplayerMadness-webgpu',
    icon: MultiplayerIcon,
    Component: MultiplayerMadnessWebGPU,
  },

  {
    id: 'noScene',
    label: 'None',
    channel: 'webgl',
    area: 'wip',
    route: 'noScene',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'dumpsterFire',
    label: 'Dumpster Fire',
    channel: 'webgl',
    area: 'showcase',
    route: 'dumpsterFire',
    icon: DumpsterFireIcon,
    Component: DumpsterFire,
  },
  {
    id: 'flyingHigh',
    label: 'Flying High',
    channel: 'webgl',
    area: 'wip',
    route: 'flyingHigh',
    icon: FlyingHighIcon,
    Component: FlyingHigh,
  },
  {
    id: 'policePresence',
    label: 'Police Presence',
    channel: 'webgl',
    area: 'wip',
    route: 'policePresence',
    icon: PoliceBadgeIcon,
    Component: PolicePresence,
  },
  {
    id: 'rowItAlone',
    label: 'Row It Alone',
    channel: 'webgl',
    area: 'wip',
    route: 'rowItAlone',
    icon: PaperBoatIcon,
    Component: RowItAlone,
  },
  {
    id: 'stayingAfloat',
    label: 'Staying Afloat',
    channel: 'webgl',
    area: 'wip',
    route: 'stayingAfloat',
    icon: LifebuoyIcon,
    Component: StayingAfloat,
  },
  {
    id: 'quinnsPlayground',
    label: "Quinn's Playground",
    channel: 'webgl',
    area: 'wip',
    route: 'quinnsPlayground',
    icon: PawIcon,
    Component: QuinnsPlayground,
  },
  {
    id: 'noScene',
    label: 'None',
    channel: 'webgpu',
    area: 'wip',
    route: 'noScene-webgpu',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'raisedByTv',
    label: 'Raised By TV',
    channel: 'webgpu',
    area: 'wip',
    route: 'raisedByTv',
    icon: CrtTestIcon,
    Component: RaisedByTV,
  },
  {
    id: 'aisle9',
    label: 'Aisle 9',
    channel: 'webgpu',
    area: 'wip',
    route: 'aisle9',
    icon: Aisle9Icon,
    Component: Aisle9,
  },

  {
    id: 'rowItAloneWebgpu',
    label: 'Row It Alone',
    channel: 'webgpu',
    area: 'wip',
    route: 'rowItAloneWebgpu',
    icon: PaperBoatIcon,
    Component: RowItAloneWebGPU,
  },
  {
    id: 'allMyFriendsAreGhosts',
    label: 'All My Friends Are Ghosts',
    channel: 'webgpu',
    area: 'wip',
    route: 'allMyFriendsAreGhosts',
    icon: GhostIcon,
    Component: AllMyFriendsAreGhosts,
  },
  {
    id: 'stayHunted',
    label: 'Stay Hunted',
    channel: 'webgpu',
    area: 'wip',
    route: 'stayHunted',
    icon: RabbitIcon,
    Component: StayHunted,
  },
  {
    id: 'ghostStories',
    label: 'Ghost Stories',
    channel: 'webgpu',
    area: 'wip',
    route: 'ghostStories',
    icon: GhostStoriesIcon,
    Component: GhostStories,
  },
  {
    id: 'myHeartIsABrokenFishTank',
    label: 'My Heart Is A Broken Fish Tank',
    channel: 'webgpu',
    area: 'wip',
    route: 'myHeartIsABrokenFishTank',
    icon: BrokenFishTankIcon,
    Component: MyHeartIsABrokenFishTank,
  },
  {
    id: 'stillPullingForYou',
    label: 'Still Pulling For You',
    channel: 'webgpu',
    area: 'wip',
    route: 'stillPullingForYou',
    icon: TugboatIcon,
    Component: StillPullingForYouWebGPU,
  },
  {
    id: 'thatsAllFolks',
    label: "That's All Folks",
    channel: 'webgpu',
    area: 'wip',
    route: 'thatsAllFolks',
    icon: ThatsAllFolksIcon,
    Component: ThatsAllFolksWebGPU,
  },
  {
    id: 'horsesForCourses',
    label: 'Horses For Courses',
    channel: 'webgpu',
    area: 'wip',
    route: 'horsesForCourses',
    icon: HorsesForCoursesIcon,
    Component: HorsesForCourses,
  },
  {
    id: 'drippingSkull',
    label: 'Dripping Skull',
    channel: 'webgpu',
    area: 'wip',
    route: 'drippingSkull',
    icon: DrippingSkullIcon,
    Component: DrippingSkull,
  },
  {
    id: 'burningCash',
    label: 'Burning Cash',
    channel: 'webgpu',
    area: 'wip',
    route: 'burningCash',
    icon: BurningCashIcon,
    Component: BurningCash,
  },
  {
    id: 'urbanWildlife',
    label: 'Urban Wildlife',
    channel: 'webgpu',
    area: 'wip',
    route: 'urbanWildlife',
    icon: UrbanWildlifeIcon,
    Component: UrbanWildlife,
  },
  {
    id: 'beautysInTheEyeOfTheBeheaded',
    label: "Beauty's In The Eye Of The Beheaded",
    channel: 'webgpu',
    area: 'showcase',
    route: 'beautysInTheEyeOfTheBeheaded',
    icon: BeautysInTheEyeOfTheBeheadedIcon,
    Component: BeautysInTheEyeOfTheBeheaded,
  },
  {
    id: 'oneInTheHand',
    label: 'One In The Hand',
    channel: 'webgpu',
    area: 'wip',
    route: 'oneInTheHand',
    icon: OneInTheHandIcon,
    Component: OneInTheHand,
  },
  {
    id: 'prayer',
    label: 'Prayer',
    channel: 'webgpu',
    area: 'wip',
    route: 'prayer',
    icon: PrayerIcon,
    Component: Prayer,
  },
  {
    id: 'apparitions',
    label: 'Apparitions',
    channel: 'webgpu',
    area: 'wip',
    route: 'apparitions',
    icon: ApparitionsIcon,
    Component: Apparitions,
  },
  {
    id: 'birdsArentReal',
    label: "Birds Aren't Real",
    channel: 'webgpu',
    area: 'showcase',
    route: 'birdsArentReal',
    icon: BirdsArentRealIcon,
    Component: BirdsArentReal,
  },
];

const sceneRegistry = buildSceneRegistry(EYE_CANDIES);

export function getScenesFor(channel, area) {
  return sceneRegistry.byArea[channel]?.[area] ?? [];
}

export function resolveScenePath(path) {
  return sceneRegistry.byPath[path] ?? null;
}

export function resolveLegacyScenePath(sceneId) {
  return sceneRegistry.byLegacyId[sceneId]?.path ?? null;
}

export function normalizeScenePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export function getAreaDefaultPath(area, channel = 'webgl') {
  return (
    sceneRegistry.areaDefaults[channel]?.[area]?.path ||
    sceneRegistry.defaultScene?.path ||
    DEFAULT_SCENE_PATH
  );
}

export function resolveSceneRoute(pathname) {
  const currentPath = normalizeScenePath(pathname);
  const scene = resolveScenePath(currentPath);

  if (scene) {
    return { scene, redirectPath: null };
  }

  const pathSegments = currentPath.split('/').filter(Boolean);

  if (pathSegments.length === 1) {
    return {
      scene: null,
      redirectPath:
        resolveLegacyScenePath(pathSegments[0]) || DEFAULT_SCENE_PATH,
    };
  }

  if (pathSegments.length === 2) {
    const [areaSegment] = pathSegments;
    const area = AREA_SEGMENT_TO_KEY[areaSegment];

    if (area) {
      return {
        scene: null,
        redirectPath: getAreaDefaultPath(area),
      };
    }
  }

  return { scene: null, redirectPath: DEFAULT_SCENE_PATH };
}

export default sceneRegistry;
