import React, { useMemo, useState } from 'react';

import { Physics } from '@react-three/rapier';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import ButtonOverlay from './components/ButtonOverlay';
import Grass from './components/Grass';
import Ground from './components/Ground';
import Knight from './components/Knight';
import Stump from './components/Stump';
import useSceneControls from './hooks/useSceneControls';
import { POSES } from './presets/poses';
import { createPressers } from './utils/press';

const NO_AVOID = [];

// A knight run through by every sword in the armory, left where he fell.
// The corpse is a Rapier ragdoll placed in a baked pose: grab to throw him
// around, or switch to stab mode and add to the collection.
export default function GoodKnight() {
  const config = useSceneControls();
  const [mode, setMode] = useState('grab');
  const pressers = useMemo(createPressers, []);
  const { stump } = POSES[config.pose];

  useSceneBackdrop({
    color: config.skyColor,
    fogFar: config.fogFar,
    fogNear: config.fogNear,
  });

  const avoid = useMemo(
    () =>
      stump
        ? [
            {
              r: stump.radius * 1.15,
              x: stump.position[0],
              z: stump.position[2],
            },
          ]
        : NO_AVOID,
    [stump]
  );

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />

      <Physics timeStep={1 / 60} debug={config.physicsDebug}>
        <Ground color={config.groundColor} radius={config.groundRadius} />
        {stump && (
          <Stump
            barkColor={config.stumpBarkColor}
            height={stump.height}
            position={stump.position}
            radius={stump.radius}
            woodColor={config.stumpWoodColor}
          />
        )}
        <Knight
          apiRef={config.knightApiRef}
          grabFollow={config.grabFollow}
          gripGuardOffset={config.gripGuardOffset}
          gripPalmOffset={config.gripPalmOffset}
          handSwordDrop={config.handSwordDrop}
          handSwordDropThreshold={config.handSwordDropThreshold}
          mode={mode}
          pose={config.pose}
          pressers={pressers}
          ragdollDamping={config.ragdollDamping}
          ragdollLinearDamping={config.ragdollLinearDamping}
          ragdollFriction={config.ragdollFriction}
          stabImpulse={config.stabImpulse}
          swordColliders={config.swordColliders}
          swordCount={config.swordCount}
          swordGapMax={config.swordGapMax}
          swordGapMin={config.swordGapMin}
          swordHeightMax={config.swordHeightMax}
          swordHeightMin={config.swordHeightMin}
          swordSeed={config.swordSeed}
          swordSpread={config.swordSpread}
          swordWidth={config.swordWidth}
        />
      </Physics>

      <Grass
        avoid={avoid}
        count={config.grassCount}
        height={config.grassHeight}
        pressers={pressers}
        pressReach={config.grassPressReach}
        radius={config.groundRadius}
        rootColor={config.grassRootColor}
        tipColor={config.grassTipColor}
        width={config.grassWidth}
        windSpeed={config.windSpeed}
        windStrength={config.windStrength}
      />

      <ButtonOverlay mode={mode} onModeChange={setMode} />
    </>
  );
}
