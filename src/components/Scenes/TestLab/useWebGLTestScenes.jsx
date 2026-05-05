import React, { lazy } from 'react';
import { BiSolidInvader } from 'react-icons/bi';
import { FaBomb, FaHandPaper, FaMusic } from 'react-icons/fa';
import { GiAtomCore } from 'react-icons/gi';
import { ImLifebuoy } from 'react-icons/im';
import { PiSkullDuotone } from 'react-icons/pi';

function NoSceneIcon() {
  return <PiSkullDuotone color="#888" />;
}
function FluidTestIcon() {
  return <ImLifebuoy color="#ef4444" />;
}
function HandStuffIcon() {
  return <FaHandPaper color="#fbbf24" />;
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

const NoScene = lazy(() => import('../../../app/scaffold/NoScene'));
const ExplosionTest = lazy(() => import('./WebGL/ExplosionTest/ExplosionTest'));
const FluidTest = lazy(() => import('./WebGL/FluidTest/FluidTest'));
const HandStuff = lazy(() => import('./WebGL/HandStuff/HandStuff'));
const ParticleLab = lazy(() => import('./WebGL/ParticleLab/ParticleLab'));
const PixelHater = lazy(() => import('./WebGL/PixelHater/PixelHater'));
const StrudelDoodle = lazy(() => import('./WebGL/StrudelDoodle/StrudelDoodle'));

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    icon: NoSceneIcon,
    Component: NoScene,
  },
  {
    id: 'fluidTest',
    label: 'Fluid Test',
    icon: FluidTestIcon,
    Component: FluidTest,
  },
  {
    id: 'handStuff',
    label: 'Hand Stuff',
    icon: HandStuffIcon,
    Component: HandStuff,
  },
  {
    id: 'pixelHater',
    label: 'PixelHater',
    icon: PixelHaterIcon,
    Component: PixelHater,
  },
  {
    id: 'particleLab',
    label: 'Particle Lab',
    icon: ParticleLabIcon,
    Component: ParticleLab,
  },
  {
    id: 'strudelDoodle',
    label: 'StrudelDoodle',
    icon: StrudelDoodleIcon,
    Component: StrudelDoodle,
  },
  {
    id: 'explosionTest',
    label: 'Explosion Test',
    icon: ExplosionIcon,
    Component: ExplosionTest,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGLTestScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
