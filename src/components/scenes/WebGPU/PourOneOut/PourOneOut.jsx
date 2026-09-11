import React, { memo, useMemo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import DomainBounds from './components/DomainBounds';
import FluidSystem from './components/FluidSystem';
import Obstacles from './components/Obstacles';
import useSceneControls from './hooks/useSceneControls';
import { GROUP_OFFSET, WORLD_SCALE } from './utils/domain';
import { buildPins, buildPlate } from './utils/pinLayout';

function PourOneOut() {
  const config = useSceneControls();

  const {
    pinCount,
    pinLength,
    pinRadius,
    pinSeed,
    pinSpread,
    pinTilt,
    plateSize,
    plateThickness,
    plateY,
  } = config;

  const pins = useMemo(
    () =>
      buildPins({
        pinCount,
        pinLength,
        pinRadius,
        pinSeed,
        pinSpread,
        pinTilt,
        plateY,
      }),
    [pinCount, pinLength, pinRadius, pinSeed, pinSpread, pinTilt, plateY]
  );

  const plate = useMemo(
    () => buildPlate({ plateSize, plateThickness, plateY }),
    [plateSize, plateThickness, plateY]
  );

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <LightingRig lighting={config.lighting} />
      <group position={GROUP_OFFSET} scale={WORLD_SCALE}>
        <Obstacles config={config} plate={plate} pins={pins} />
        <FluidSystem config={config} plate={plate} pins={pins} />
        {config.showBounds && <DomainBounds color={config.boundsColor} />}
      </group>
    </>
  );
}

export default memo(PourOneOut);
