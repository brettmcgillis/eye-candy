import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGPUShowcaseScenes from './useWebGPUShowcaseScenes';

export default function WebGPUShowcase() {
  const { scenes } = useWebGPUShowcaseScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Showcase Selection',
    queryParam: 'webgpuShowcaseScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
