import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGPUTestScenes from './useWebGPUTestScenes';

export default function WebGPUTestLab() {
  const { scenes } = useWebGPUTestScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Test Selection',
    queryParam: 'webgpuTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
