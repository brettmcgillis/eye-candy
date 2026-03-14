import { lazy } from 'react';

import NoScene from './scaffold/NoScene';

const CRTTest = lazy(() => import('../components/scenes/CRTTest/CrtTest'));
const DumpsterFire = lazy(
  () => import('../components/scenes/DumpsterFire/DumpsterFire')
);
const FoldedFrame = lazy(
  () => import('../components/scenes/FoldedFrame/FoldedFrame')
);
const LoGlow = lazy(() => import('../components/scenes/LoGlow/LoGlow'));
const NewScene = lazy(() => import('../components/scenes/NewScene/NewScene'));
const PaperStack = lazy(
  () => import('../components/scenes/PaperStack/PaperStack')
);
const PenPlotter = lazy(
  () => import('../components/scenes/PenPlotter/PenPlotter')
);
const QuinnsDice = lazy(
  () => import('../components/scenes/QuinnsDice/QuinnsDice')
);
const Rosie = lazy(() => import('../components/scenes/Rosie/Rosie'));
const WebGLTestLab = lazy(
  () => import('../components/scenes/TestLab/WebGLTestLab')
);
const WebGPUTestLab = lazy(
  () => import('../components/scenes/TestLab/WebGPUTestLab')
);

const noScene = {
  id: 'noScene',
  renderer: 'webgl',
  label: 'None',
  Component: NoScene,
  icon: '💀',
  public: true,
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

const penPlotter = {
  id: 'penPlotter',
  renderer: 'webgl',
  Component: PenPlotter,
  label: 'Pen Plotter',
  icon: '📐🖊️',
  public: true,
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
  dumpsterFire,
  foldedFrame,
  loGlow,
  newScene,
  paperStack,
  penPlotter,
  webglTestLab,
  crtTest,
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

const sortedScenes = [...scenes].sort(compareScenes);

export default function useScenes() {
  return { scenes: sortedScenes };
}
