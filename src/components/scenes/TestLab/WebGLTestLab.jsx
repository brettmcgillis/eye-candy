import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGLTestLab() {
  const scenes = getScenesFor('webgl', 'testlab');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Test Selection',
    queryParam: 'webglTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
