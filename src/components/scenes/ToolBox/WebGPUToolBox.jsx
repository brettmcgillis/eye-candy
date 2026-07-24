import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGPUToolBox() {
  const scenes = getScenesFor('webgpu', 'toolbox');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Tool Selection',
    queryParam: 'webgpuToolScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
