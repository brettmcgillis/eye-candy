import { lazy } from 'react';

import NoScene from './scaffold/NoScene';

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

const scenes = [
  noScene,
  webglTestLab,
  webgpuTestLab,
  webglToolBox,
  webgpuToolBox,
  webglWorkInProgress,
  webgpuWorkInProgress,
  webglShowcase,
  webgpuShowcase,
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
