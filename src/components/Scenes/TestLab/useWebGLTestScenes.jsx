import ExplosionTest from '../ExplosionTest/ExplosionTest';
import FluidTest from '../FluidTest/FluidTest';
import HandStuff from '../HandStuff/HandStuff';
import PixelHater from '../PixelHater/PixelHater';
import StrudelDoodle from '../StrudelDoodle/StrudelDoodle';

const scenes = [
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
  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGLTestScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
