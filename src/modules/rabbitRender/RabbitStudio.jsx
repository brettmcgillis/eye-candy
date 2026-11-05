import React, { useEffect, useMemo } from 'react';

import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { Backdrop } from '@modules/renderStage';

import HuntedSubject from './HuntedSubject';
import LIGHTING from './lighting';
import useNeutralToneMapping from './useNeutralToneMapping';

// RabbitCLI's stage: the scene's subject under the scene's own lights
// (the Painting preset's), on its paper. The CLI mounts it headlessly and
// the Live tab in the page.
export default function RabbitStudio({
  config,
  handles,
  playing = true,
  startTime = 0,
  transparent = false,
}) {
  useNeutralToneMapping();
  const lights = useMemo(
    () =>
      createSceneLights(
        buildSceneLightingRuntimeConfig({ controls: {}, lighting: LIGHTING })
      ),
    []
  );
  useEffect(
    () => () => lights.traverse((light) => light.isLight && light.dispose?.()),
    [lights]
  );

  return (
    <>
      <Backdrop color={transparent ? null : config.paperColor} />
      <primitive object={lights} />
      <HuntedSubject
        config={config}
        handles={handles}
        playing={playing}
        startTime={startTime}
      />
    </>
  );
}
