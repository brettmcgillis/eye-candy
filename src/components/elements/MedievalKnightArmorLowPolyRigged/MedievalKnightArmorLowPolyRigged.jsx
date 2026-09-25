/* eslint-disable no-underscore-dangle */
import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import canonicalizeSword from '@utils/swordGeometry';

import { modelFile } from '../../../utils/appUtils';

const MODEL = modelFile('medieval_knight_armor_low-poly__rigged.glb');
const SHEATHED_SWORD = 'Object_27';

export function knightBoneKey(name) {
  return name.replace(/[.\s]/g, '').replace(/_\d+$/, '');
}

// The whole cloned scene with its native skin binding, for scenes that drive
// the skeleton themselves (ragdolls, procedural poses).
export function useKnightModel() {
  const { scene } = useGLTF(MODEL);
  return React.useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.updateMatrixWorld(true);
    const bones = {};
    const meshes = [];
    clone.traverse((object) => {
      if (object.isBone) bones[knightBoneKey(object.name)] = object;
      if (object.isSkinnedMesh) meshes.push(object);
    });
    return { bones, meshes, scene: clone };
  }, [scene]);
}

// Hides the sheathed blade and returns it as a canonical rigid sword
// (crossguard at origin, +Y to the tip) plus its world frame at rest.
export function extractKnightSword({ meshes }) {
  const mesh = meshes.find((m) => m.name === SHEATHED_SWORD);
  mesh.visible = false;
  mesh.skeleton.update();
  const geometry = mesh.geometry.clone();
  const { position } = geometry.attributes;
  const v = new Vector3();
  for (let i = 0; i < position.count; i += 1) {
    mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.deleteAttribute('skinIndex');
  geometry.deleteAttribute('skinWeight');
  return { ...canonicalizeSword(geometry), material: mesh.material };
}

export default function MedievalKnightArmorLowPolyRigged(props) {
  const { scene } = useGLTF(MODEL);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes._rootJoint} />
      <skinnedMesh
        geometry={nodes.Object_7.geometry}
        material={materials.FeatherRed}
        skeleton={nodes.Object_7.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_8.geometry}
        material={materials.EdgeReins}
        skeleton={nodes.Object_8.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_9.geometry}
        material={materials.BaseMetal}
        skeleton={nodes.Object_9.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_10.geometry}
        material={materials.RimsMetal}
        skeleton={nodes.Object_10.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_11.geometry}
        material={materials.Screw}
        skeleton={nodes.Object_11.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_12.geometry}
        material={materials.Padding}
        skeleton={nodes.Object_12.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_13.geometry}
        material={materials.GorgetMetal}
        skeleton={nodes.Object_13.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_14.geometry}
        material={materials.LeftShoulderMetal}
        skeleton={nodes.Object_14.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_15.geometry}
        material={materials.ArmMetal}
        skeleton={nodes.Object_15.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_16.geometry}
        material={materials.TorsoMetal}
        skeleton={nodes.Object_16.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_17.geometry}
        material={materials.TorsoArmorHanger}
        skeleton={nodes.Object_17.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_18.geometry}
        material={materials.BeltsBucklesTorso}
        skeleton={nodes.Object_18.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_19.geometry}
        material={materials.Ridges}
        skeleton={nodes.Object_19.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_20.geometry}
        material={materials.Belt}
        skeleton={nodes.Object_20.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_21.geometry}
        material={materials.HolsterMetal}
        skeleton={nodes.Object_21.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_22.geometry}
        material={materials.legArmor}
        skeleton={nodes.Object_22.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_23.geometry}
        material={materials.BeltsBucklesSmall}
        skeleton={nodes.Object_23.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_24.geometry}
        material={materials.HingeMetal}
        skeleton={nodes.Object_24.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_25.geometry}
        material={materials.GauntletMetal}
        skeleton={nodes.Object_25.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_26.geometry}
        material={materials.GauntletLeather}
        skeleton={nodes.Object_26.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_27.geometry}
        material={materials.Type_Xiiia_Texture}
        skeleton={nodes.Object_27.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_28.geometry}
        material={materials.ScabbardLeather}
        skeleton={nodes.Object_28.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_29.geometry}
        material={materials.ScabbardCopper}
        skeleton={nodes.Object_29.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_30.geometry}
        material={materials.ScabbardRing}
        skeleton={nodes.Object_30.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_31.geometry}
        material={materials.ChainMail}
        skeleton={nodes.Object_31.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_32.geometry}
        material={materials['ChainMail.001']}
        skeleton={nodes.Object_32.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_33.geometry}
        material={materials.FootLeather}
        skeleton={nodes.Object_33.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
      <skinnedMesh
        geometry={nodes.Object_34.geometry}
        material={materials.GloveLeatherRight}
        skeleton={nodes.Object_34.skeleton}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.85}
      />
    </group>
  );
}

useGLTF.preload(MODEL);
