import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGPUWorkInProgress() {
  const scenes = getScenesFor('webgpu', 'wip');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU WIP Selection',
    queryParam: 'webgpuWipScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
