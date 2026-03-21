import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGLToolScenes from './useWebGLToolScenes';

export default function WebGLToolBox() {
  const { scenes } = useWebGLToolScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Tool Selection',
    queryParam: 'webglToolScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
