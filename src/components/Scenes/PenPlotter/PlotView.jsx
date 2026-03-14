import React from 'react';

import useTestLabSceneSelector from '../../../hooks/useSubSceneSelector';
import usePlotterScenes from './Hooks/usePlotterScenes';

export default function PlotView() {
  const { scenes } = usePlotterScenes();
  const { SceneComponent } = useTestLabSceneSelector({
    scenes,
    defaultSceneId: 'primitivesTest',
    groupLabel: 'Plot Scene',
    queryParam: 'plotScene',
  });

  return SceneComponent ? <SceneComponent /> : null;
}
