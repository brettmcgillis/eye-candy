import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGPUToolScenes from './useWebGPUToolScenes';

export default function WebGPUToolBox() {
  const { scenes } = useWebGPUToolScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Tool Selection',
    queryParam: 'webgpuToolScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
