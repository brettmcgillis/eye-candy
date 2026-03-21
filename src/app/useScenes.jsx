import { lazy } from 'react';

import NoScene from './scaffold/NoScene';

const FoldedFrame = lazy(
  () => import('../components/scenes/Showcase/WebGL/FoldedFrame/FoldedFrame')
);
const LoGlow = lazy(
  () => import('../components/scenes/Showcase/WebGL/LoGlow/LoGlow')
);
const NewScene = lazy(
  () => import('../components/scenes/Showcase/WebGL/NewScene/NewScene')
);
const PaperStack = lazy(
  () => import('../components/scenes/Showcase/WebGL/PaperStack/PaperStack')
);
const PenPlotter = lazy(
  () => import('../components/scenes/Showcase/WebGL/PenPlotter/PenPlotter')
);
const QuinnsDice = lazy(
  () => import('../components/scenes/Showcase/WebGL/QuinnsDice/QuinnsDice')
);
const Rosie = lazy(
  () => import('../components/scenes/Showcase/WebGL/Rosie/Rosie')
);
const WebGLTestLab = lazy(
  () => import('../components/scenes/TestLab/WebGLTestLab')
);
const WebGPUTestLab = lazy(
  () => import('../components/scenes/TestLab/WebGPUTestLab')
);
const WebGLToolBox = lazy(
  () => import('../components/scenes/ToolBox/WebGLToolBox')
);
const WebGPUToolBox = lazy(
  () => import('../components/scenes/ToolBox/WebGPUToolBox')
);
const WebGLWorkInProgress = lazy(
  () => import('../components/scenes/WorkInProgress/WebGLWorkInProgress')
);
const WebGPUWorkInProgress = lazy(
  () => import('../components/scenes/WorkInProgress/WebGPUWorkInProgress')
);
const WebGLShowcase = lazy(
  () => import('../components/scenes/Showcase/WebGLShowcase')
);
const WebGPUShowcase = lazy(
  () => import('../components/scenes/Showcase/WebGPUShowcase')
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

const webgpuTestLab = {
  id: 'webgpuTestLab',
  renderer: 'webgpu',
  Component: WebGPUTestLab,
  label: 'WebGPU Test Lab',
  icon: '🧪',
  public: false,
  linkable: true,
};

const webglToolBox = {
  id: 'webglToolBox',
  renderer: 'webgl',
  Component: WebGLToolBox,
  label: 'WebGL Tool Box',
  icon: '🧰',
  public: false,
  linkable: true,
};

const webgpuToolBox = {
  id: 'webgpuToolBox',
  renderer: 'webgpu',
  Component: WebGPUToolBox,
  label: 'WebGPU Tool Box',
  icon: '🧰',
  public: false,
  linkable: true,
};

const webglWorkInProgress = {
  id: 'webglWorkInProgress',
  renderer: 'webgl',
  Component: WebGLWorkInProgress,
  label: 'WebGL Work In Progress',
  icon: '🚧',
  public: false,
  linkable: true,
};

const webgpuWorkInProgress = {
  id: 'webgpuWorkInProgress',
  renderer: 'webgpu',
  Component: WebGPUWorkInProgress,
  label: 'WebGPU Work In Progress',
  icon: '🚧',
  public: false,
  linkable: true,
};

const webglShowcase = {
  id: 'webglShowcase',
  renderer: 'webgl',
  Component: WebGLShowcase,
  label: 'WebGL Showcase',
  icon: '🎬',
  public: false,
  linkable: true,
};

const webgpuShowcase = {
  id: 'webgpuShowcase',
  renderer: 'webgpu',
  Component: WebGPUShowcase,
  label: 'WebGPU Showcase',
  icon: '🎬',
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
  foldedFrame,
  loGlow,
  newScene,
  paperStack,
  penPlotter,
  webglTestLab,
  webgpuTestLab,
  webglToolBox,
  webgpuToolBox,
  webglWorkInProgress,
  webgpuWorkInProgress,
  webglShowcase,
  webgpuShowcase,
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
