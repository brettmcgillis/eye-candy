import React from 'react';

import { getScenesFor } from '../../../app/sceneRegistry';
import useSubSceneSelector from '../../../hooks/useSubSceneSelector';

export default function WebGLShowcase() {
  const scenes = getScenesFor('webgl', 'showcase');
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Showcase Selection',
    queryParam: 'webglShowcaseScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
