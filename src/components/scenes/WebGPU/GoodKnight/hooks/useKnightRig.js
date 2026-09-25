/* eslint-disable no-param-reassign */
import { useMemo } from 'react';

import {
  extractKnightSword,
  useKnightModel,
} from '@elements/MedievalKnightArmorLowPolyRigged/MedievalKnightArmorLowPolyRigged';

import { curlFist } from '../utils/grip';
import { describeRagdoll } from '../utils/skeleton';
import { restTorsoTargets } from '../utils/swordPlacement';

// Everything derived from the knight at rest, captured once before the
// ragdoll takes the skeleton over.
export default function useKnightRig() {
  const model = useKnightModel();

  return useMemo(() => {
    const { bones, meshes, scene } = model;
    meshes.forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
    });
    const beltSword = extractKnightSword(model);
    const torsoTargets = restTorsoTargets(meshes);
    curlFist(bones, 'R');
    const rig = describeRagdoll(bones);
    return { beltSword, bones, rig, scene, torsoTargets };
  }, [model]);
}
