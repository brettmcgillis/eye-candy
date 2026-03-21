import React from 'react';

import useSubSceneSelector from '../../../hooks/useSubSceneSelector';
import useWebGLShowcaseScenes from './useWebGLShowcaseScenes';

export default function WebGLShowcase() {
  const { scenes } = useWebGLShowcaseScenes();
  const { SceneComponent } = useSubSceneSelector({
    scenes,
    defaultSceneId: 'noScene',
    groupLabel: 'WebGL Showcase Selection',
    queryParam: 'webglShowcaseScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
