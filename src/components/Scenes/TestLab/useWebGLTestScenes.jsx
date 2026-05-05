import { lazy } from 'react';
import { FaBomb, FaHandPaper, FaMicroscope, FaMusic } from 'react-icons/fa';
import { BiSolidInvader } from 'react-icons/bi';
import { ImLifebuoy } from 'react-icons/im';
import { PiSkullDuotone } from 'react-icons/pi';

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
    icon: PiSkullDuotone,
    Component: NoScene,
  },
  {
    id: 'fluidTest',
    label: 'Fluid Test',
    icon: ImLifebuoy,
    Component: FluidTest,
  },
  {
    id: 'handStuff',
    label: 'Hand Stuff',
    icon: FaHandPaper,
    Component: HandStuff,
  },
  {
    id: 'pixelHater',
    label: 'PixelHater',
    icon: BiSolidInvader,
    Component: PixelHater,
  },
  {
    id: 'particleLab',
    label: 'Particle Lab',
    icon: FaMicroscope,
    Component: ParticleLab,
  },
  {
    id: 'strudelDoodle',
    label: 'StrudelDoodle',
    icon: FaMusic,
    Component: StrudelDoodle,
  },
  {
    id: 'explosionTest',
    label: 'Explosion Test',
    icon: FaBomb,
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
