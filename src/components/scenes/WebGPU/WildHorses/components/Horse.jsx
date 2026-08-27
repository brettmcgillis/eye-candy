/* eslint-disable no-underscore-dangle */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';
import { texture as tslTexture, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

const MODEL = 'animated_horse.glb';
const RUN_CLIP = 'HorseALL_RunLoop';
const SADDLE_MATERIAL = 'CH_NPC_MNT_WHsaddle01_MI_KEJ';

// The rig's own transform leaves the horse facing -X. The field travels +Z, so
// a horse running "forward" has to face -Z into it — otherwise the gallop and
// the ground disagree by 90 degrees. Herd jitter composes on the outer group.
const BASE_HEADING = -Math.PI / 2;

// Bone chains the fire emitter samples. Tail runs root -> tip; mane runs along
// the neck into the head, which is where the crest hair sits on this rig.
export const TAIL_BONES = [
  'BN_Tail_01_07',
  'BN_Tail_02_08',
  'BN_Tail_03_09',
  'BN_Tail_04_010',
  'BN_Tail_05_011',
];

export const MANE_BONES = [
  'Bip01_Spine2_028',
  'Bip01_Neck_034',
  'Bip01_Neck1_053',
  'Bip01_Head_057',
];

function Horse({
  clipOffset = 0,
  coatColor,
  coatDarkness,
  dayNight,
  onBonesReady,
  runSpeed,
  ...props
}) {
  const group = useRef();
  const { animations, scene } = useGLTF(modelFile(MODEL));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { materials, nodes } = useGraph(clone);
  const { actions } = useAnimations(animations, group);

  const coat = useMemo(() => {
    const source = Object.values(materials).find(
      (material) => material.name !== SADDLE_MATERIAL
    );
    const material = new THREE.MeshStandardNodeMaterial();
    material.roughness = 0.85;
    material.metalness = 0.0;

    // The coat still reads as a lit surface, but it dims with the same scalar
    // the unlit grass and ground use, so the herd doesn't stay daylit at night.
    const base = uniform(new THREE.Color(coatColor));
    const tinted = base.mul(dayNight.lightIntensity);
    material.colorNode = source?.map
      ? tslTexture(source.map).rgb.mul(tinted)
      : tinted;

    return Object.assign(material, { baseColor: base });
  }, [dayNight, materials]);

  useEffect(() => () => coat.dispose(), [coat]);

  useEffect(() => {
    coat.baseColor.value.set(coatColor).multiplyScalar(1 - coatDarkness);
  }, [coat, coatColor, coatDarkness]);

  const skinned = useMemo(() => {
    return Object.values(nodes).filter(
      (node) => node.isSkinnedMesh && node.material?.name !== SADDLE_MATERIAL
    );
  }, [nodes]);

  useEffect(() => {
    const action = actions[RUN_CLIP];
    if (!action) return undefined;

    action.reset().play();
    action.time = action.getClip().duration * clipOffset;

    return () => action.stop();
  }, [actions, clipOffset]);

  useEffect(() => {
    const action = actions[RUN_CLIP];
    if (action) action.timeScale = runSpeed;
  }, [actions, runSpeed]);

  useEffect(() => {
    if (!onBonesReady) return;

    const byName = new Map();
    clone.traverse((child) => byName.set(child.name, child));

    onBonesReady({
      mane: MANE_BONES.map((name) => byName.get(name)).filter(Boolean),
      tail: TAIL_BONES.map((name) => byName.get(name)).filter(Boolean),
    });
  }, [clone, onBonesReady]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group rotation={[0, BASE_HEADING, 0]}>
        <primitive object={nodes._rootJoint} />
        {skinned.map((mesh) => (
          <skinnedMesh
            key={mesh.uuid}
            castShadow
            geometry={mesh.geometry}
            material={coat}
            rotation={[-Math.PI / 2, 0, -Math.PI]}
            scale={0.01}
            skeleton={mesh.skeleton}
          />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(MODEL));

export default memo(Horse);
