import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGLTestScenes from './useWebGLTestScenes';

export default function WebGLTestLab() {
  const { scenes } = useWebGLTestScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Test Selection',
    queryParam: 'webglTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
