import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGLToolBox() {
  const scenes = getScenesFor('webgl', 'toolbox');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Tool Selection',
    queryParam: 'webglToolScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
