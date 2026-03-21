import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGPUWorkInProgressScenes from './useWebGPUWorkInProgressScenes';

export default function WebGPUWorkInProgress() {
  const { scenes } = useWebGPUWorkInProgressScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU WIP Selection',
    queryParam: 'webgpuWipScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
