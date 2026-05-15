import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGLWorkInProgress() {
  const scenes = getScenesFor('webgl', 'wip');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL WIP Selection',
    queryParam: 'webglWipScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
