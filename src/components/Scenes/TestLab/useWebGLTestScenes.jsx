import NoScene from '../../../app/scaffold/NoScene';
import ExplosionTest from '../ExplosionTest/ExplosionTest';
import FluidTest from '../FluidTest/FluidTest';
import HandStuff from '../HandStuff/HandStuff';
import ParticleLab from '../ParticleLab/ParticleLab';
import PixelHater from '../PixelHater/PixelHater';
import PlotterTest from '../PlotterTest/PlotterTest';
import PrimitivesHatchingScene from '../PlotterTest/examples/PrimitivesHatchingScene';
import StrudelDoodle from '../StrudelDoodle/StrudelDoodle';

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
  {
    id: 'plotterTest',
    label: 'Plotter Test',
    Component: PlotterTest,
  },
  {
    id: 'primitivesHatchingScene',
    label: 'Primitives Hatching Scene',
    Component: PrimitivesHatchingScene,
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
