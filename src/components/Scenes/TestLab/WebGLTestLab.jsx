import React from 'react';

import useTestLabSceneSelector from './TestLab';
import useWebGLTestScenes from './useWebGLTestScenes';

export default function WebGLTestLab() {
  const { scenes } = useWebGLTestScenes();
  const { SceneComponent } = useTestLabSceneSelector({
    scenes,
    defaultSceneId: 'fluidTest',
    groupLabel: 'WebGL Test Selection',
    queryParam: 'webglTestScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
