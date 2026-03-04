import React from 'react';

import useTestLabSceneSelector from './TestLab';
import useWebGPUTestScenes from './useWebGPUTestScenes';

export default function WebGPUTestLab() {
  const { scenes } = useWebGPUTestScenes();
  const { SceneComponent } = useTestLabSceneSelector({
    scenes,
    defaultSceneId: 'networkTest',
    groupLabel: 'WebGPU Test Selection',
    queryParam: 'webgpuTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
