import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGPUShowcase() {
  const scenes = getScenesFor('webgpu', 'showcase');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGPU Showcase Selection',
    queryParam: 'webgpuShowcaseScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
