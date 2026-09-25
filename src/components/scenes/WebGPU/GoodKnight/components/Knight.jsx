/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { useSwordPackBlades } from '@elements/MedievalSwordPack/MedievalSwordPack';

import useKnightRig from '../hooks/useKnightRig';
import useRagdoll from '../hooks/useRagdoll';
import { POSES } from '../presets/poses';
import { driveBones } from '../utils/boneDriver';
import { gripMatrix } from '../utils/grip';
import { writePressers } from '../utils/press';
import HandSword from './HandSword';
import ImpaledSwords from './ImpaledSwords';
import Interaction from './Interaction';

function Knight({
  apiRef,
  clickAction,
  grabFollow,
  gripGuardOffset,
  gripPalmOffset,
  handSwordDrop,
  handSwordDropThreshold,
  pose,
  pressers,
  ragdollDamping,
  ragdollEnabled,
  ragdollLinearDamping,
  ragdollFriction,
  stabImpulse,
  swordColliders,
  swordCount,
  swordHeightMax,
  swordHeightMin,
  swordPierceMax,
  swordPierceMin,
  swordSeed,
  swordSpread,
  swordWidth,
}) {
  const { beltSword, bones, rig, scene, torsoTargets } = useKnightRig();
  const blades = useSwordPackBlades();
  const impalementsRef = useRef(null);

  const { capture, drop, generation, ragdoll, reset } = useRagdoll(rig, {
    damping: ragdollDamping,
    enabled: ragdollEnabled,
    linearDamping: ragdollLinearDamping,
    friction: ragdollFriction,
    pose: POSES[pose],
  });

  useEffect(() => {
    apiRef.current = { capture, drop, reset };
  }, [apiRef, capture, drop, reset]);

  const gripWorld = useMemo(
    () =>
      gripMatrix(bones, 'R', {
        guardOffset: gripGuardOffset,
        palmOffset: gripPalmOffset,
      }),
    [bones, gripGuardOffset, gripPalmOffset]
  );

  const placement = useMemo(
    () => ({
      count: swordCount,
      heightMax: swordHeightMax,
      heightMin: swordHeightMin,
      pierceMax: swordPierceMax,
      pierceMin: swordPierceMin,
      seed: swordSeed,
      side: POSES[pose].swordSide,
      spread: swordSpread,
      waist: 0.95,
      width: swordWidth,
    }),
    [
      pose,
      swordCount,
      swordHeightMax,
      swordHeightMin,
      swordPierceMax,
      swordPierceMin,
      swordSeed,
      swordSpread,
      swordWidth,
    ]
  );

  const stab = useMemo(
    () => ({
      impulse: stabImpulse,
      pierceMax: swordPierceMax,
      pierceMin: swordPierceMin,
    }),
    [stabImpulse, swordPierceMax, swordPierceMin]
  );

  useFrame(() => {
    if (!ragdoll) return;
    driveBones(rig, bones, ragdoll.bodies);
    writePressers(pressers, rig, ragdoll.bodies);
  });

  return (
    <>
      <primitive object={scene} />
      {ragdoll && (
        <>
          <ImpaledSwords
            blades={blades}
            generation={generation}
            impalementsRef={impalementsRef}
            placement={placement}
            ragdoll={ragdoll}
            rig={rig}
            swordColliders={swordColliders}
            torsoTargets={torsoTargets}
          />
          <HandSword
            dropEnabled={handSwordDrop && ragdollEnabled}
            dropThreshold={handSwordDropThreshold}
            generation={generation}
            gripWorld={gripWorld}
            ragdoll={ragdoll}
            rig={rig}
            sword={beltSword}
          />
          <Interaction
            blades={blades}
            followRate={grabFollow}
            impalementsRef={impalementsRef}
            mode={clickAction}
            ragdoll={ragdoll}
            stab={stab}
          />
        </>
      )}
    </>
  );
}

export default memo(Knight);
