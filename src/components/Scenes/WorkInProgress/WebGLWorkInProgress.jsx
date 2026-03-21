import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGLWorkInProgressScenes from './useWebGLWorkInProgressScenes';

export default function WebGLWorkInProgress() {
  const { scenes } = useWebGLWorkInProgressScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL WIP Selection',
    queryParam: 'webglWipScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
