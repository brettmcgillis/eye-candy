import React from 'react';
import { FaFlask, FaToolbox, FaTools } from 'react-icons/fa';

import useWebGLShowcaseScenes from '../components/scenes/Showcase/useWebGLShowcaseScenes';
import useWebGPUShowcaseScenes from '../components/scenes/Showcase/useWebGPUShowcaseScenes';
import useWebGLTestScenes from '../components/scenes/TestLab/useWebGLTestScenes';
import useWebGPUTestScenes from '../components/scenes/TestLab/useWebGPUTestScenes';
import useWebGLToolScenes from '../components/scenes/ToolBox/useWebGLToolScenes';
import useWebGPUToolScenes from '../components/scenes/ToolBox/useWebGPUToolScenes';
import useWebGLWorkInProgressScenes from '../components/scenes/WorkInProgress/useWebGLWorkInProgressScenes';
import useWebGPUWorkInProgressScenes from '../components/scenes/WorkInProgress/useWebGPUWorkInProgressScenes';

function WipAreaIcon() {
  return <FaTools color="#94a3b8" />;
}
function TestlabAreaIcon() {
  return <FaFlask color="#22c55e" />;
}
function ToolboxAreaIcon() {
  return <FaToolbox color="#dc2626" />;
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

export default function useScenes() {
  const webglShowcase = useWebGLShowcaseScenes();
  const webgpuShowcase = useWebGPUShowcaseScenes();
  const webglTestlab = useWebGLTestScenes();
  const webgpuTestlab = useWebGPUTestScenes();
  const webglWip = useWebGLWorkInProgressScenes();
  const webgpuWip = useWebGPUWorkInProgressScenes();
  const webglToolbox = useWebGLToolScenes();
  const webgpuToolbox = useWebGPUToolScenes();

  return {
    webgl: {
      showcase: webglShowcase.scenes,
      wip: webglWip.scenes,
      testlab: webglTestlab.scenes,
      toolbox: webglToolbox.scenes,
    },
    webgpu: {
      showcase: webgpuShowcase.scenes,
      wip: webgpuWip.scenes,
      testlab: webgpuTestlab.scenes,
      toolbox: webgpuToolbox.scenes,
    },
  };
}
