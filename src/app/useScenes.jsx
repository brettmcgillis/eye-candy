import CRTTest from '../components/scenes/CRTTest/CrtTest';
import DumpsterFire from '../components/scenes/DumpsterFire/DumpsterFire';
import FoldedFrame from '../components/scenes/FoldedFrame/FoldedFrame';
import HandStuff from '../components/scenes/HandStuff/HandStuff';
import LoGlow from '../components/scenes/LoGlow/LoGlow';
import NewScene from '../components/scenes/NewScene/NewScene';
import PaperStack from '../components/scenes/PaperStack/PaperStack';
import PixelHater from '../components/scenes/PixelHater/PixelHater';
import QuinnsDice from '../components/scenes/QuinnsDice/QuinnsDice';
import Rosie from '../components/scenes/Rosie/Rosie';
import StrudelDoodle from '../components/scenes/StrudelDoodle/StrudelDoodle';
import WebGLTestLab from '../components/scenes/TestLab/WebGLTestLab';
import WebGPUTestLab from '../components/scenes/TestLab/WebGPUTestLab';
import NoScene from './scaffold/NoScene';

const noScene = {
  id: 'noScene',
  renderer: 'webgl',
  label: 'None',
  Component: NoScene,
  icon: '💀',
  public: true,
  linkable: true,
};

const pixelHater = {
  id: 'pixelHater',
  renderer: 'webgl',
  Component: PixelHater,
  label: 'PixelHater',
  icon: '👾',
  public: false,
  linkable: true,
};

const dumpsterFire = {
  id: 'dumpsterFire',
  renderer: 'webgl',
  Component: DumpsterFire,
  label: 'Dumpster Fire',
  icon: '🗑️🔥',
  public: false,
  linkable: false,
};

const foldedFrame = {
  id: 'foldedFrame',
  renderer: 'webgl',
  Component: FoldedFrame,
  label: 'Folded Frame',
  icon: '⬜️ ◻️ ▫️',
  public: true,
  linkable: true,
};

const loGlow = {
  id: 'loGlow',
  renderer: 'webgl',
  Component: LoGlow,
  label: 'LoGlow',
  icon: '',
  public: true,
  linkable: true,
};

const newScene = {
  id: 'newScene',
  renderer: 'webgl',
  Component: NewScene,
  label: 'New Scene',
  icon: '☠️',
  public: true,
  linkable: true,
};

const paperStack = {
  id: 'paperStack',
  renderer: 'webgl',
  Component: PaperStack,
  label: 'Paper Stack',
  icon: '📚',
  public: true,
  linkable: true,
};

const handStuff = {
  id: 'handStuff',
  renderer: 'webgl',
  Component: HandStuff,
  label: 'Hand Stuff',
  icon: '👌',
  public: false,
  linkable: true,
};

const webglTestLab = {
  id: 'webglTestLab',
  renderer: 'webgl',
  Component: WebGLTestLab,
  label: 'WebGL Test Lab',
  icon: '🧪',
  public: false,
  linkable: true,
};

const crtTest = {
  id: 'crtTest',
  renderer: 'webgl',
  Component: CRTTest,
  label: 'CRT Test',
  icon: '📺',
  public: false,
  linkable: false,
};

const strudelDoodle = {
  id: 'strudelDoodle',
  renderer: 'webgl',
  Component: StrudelDoodle,
  label: 'StrudelDoodle',
  icon: '🎵',
  public: false,
  linkable: true,
};

const webgpuTestLab = {
  id: 'webgpuTestLab',
  renderer: 'webgpu',
  Component: WebGPUTestLab,
  label: 'WebGPU Test Lab',
  icon: '🧪',
  public: false,
  linkable: true,
};

const rosie = {
  id: 'rosie',
  renderer: 'webgl',
  Component: Rosie,
  label: 'Rosie',
  icon: '🌹❤️',
  public: false,
  linkable: true,
};

const dice = {
  id: 'dice',
  renderer: 'webgl',
  Component: QuinnsDice,
  label: "Quinn's Dice",
  icon: '🎲',
  public: false,
  linkable: true,
};

const scenes = [
  noScene,
  pixelHater,
  dumpsterFire,
  foldedFrame,
  loGlow,
  newScene,
  paperStack,
  handStuff,
  webglTestLab,
  crtTest,
  strudelDoodle,
  webgpuTestLab,
  rosie,
  dice,
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;
  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
