import { lazy } from 'react';

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
    Component: NoScene,
  },
  {
    id: 'fluidTest',
    label: 'Fluid Test',
    Component: FluidTest,
  },
  {
    id: 'handStuff',
    label: 'Hand Stuff',
    Component: HandStuff,
  },
  {
    id: 'pixelHater',
    label: 'PixelHater',
    Component: PixelHater,
  },
  {
    id: 'particleLab',
    label: 'Particle Lab',
    Component: ParticleLab,
  },
  {
    id: 'strudelDoodle',
    label: 'StrudelDoodle',
    Component: StrudelDoodle,
  },
  {
    id: 'explosionTest',
    label: 'Explosion Test',
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
