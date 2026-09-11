import React, { memo, useMemo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Ocean from './components/Ocean';
import Shore from './components/Shore';
import useSceneControls from './hooks/useSceneControls';
import buildBedField from './runtime/bedField';

function Shoreline() {
  const config = useSceneControls();

  const {
    boulderCount,
    deepDepth,
    rockRelief,
    shoreHeight,
    shoreSeed,
    slopeCurve,
    surfWidth,
  } = config;

  // The bed is the one baked thing the terrain mesh, the solver's bathymetry
  // and the waterline shading all read, so it is rebuilt only when its own
  // shape controls move.
  const bed = useMemo(
    () =>
      buildBedField({
        boulderCount,
        deepDepth,
        rockRelief,
        shoreHeight,
        shoreSeed,
        slopeCurve,
        surfWidth,
      }),
    [
      boulderCount,
      deepDepth,
      rockRelief,
      shoreHeight,
      shoreSeed,
      slopeCurve,
      surfWidth,
    ]
  );

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <fog
        attach="fog"
        args={[config.backgroundColor, config.fogNear, config.fogFar]}
      />
      <LightingRig lighting={config.lighting} />
      <Shore bed={bed} config={config} />
      <Ocean bed={bed} config={config} />
    </>
  );
}

export default memo(Shoreline);
