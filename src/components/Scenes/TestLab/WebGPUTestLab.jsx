import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGPUTestLab() {
  const scenes = getScenesFor('webgpu', 'testlab');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Test Selection',
    queryParam: 'webgpuTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
