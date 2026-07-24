/* eslint-disable no-underscore-dangle */
import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Skeleton(props) {
  const { nodes, materials } = useGLTF(modelFile('/male_skeleton.glb'));
  return (
    <group {...props} dispose={null}>
      <group>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
            <group>
              <group>
                <primitive object={nodes._rootJoint} />
                <skinnedMesh
                  geometry={nodes.Object_6.geometry}
                  material={materials.ArmsHands}
                  skeleton={nodes.Object_6.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_7.geometry}
                  material={materials.HipsLegs}
                  skeleton={nodes.Object_7.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_8.geometry}
                  material={materials.Sacrum}
                  skeleton={nodes.Object_8.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_9.geometry}
                  material={materials.HipCartilage}
                  skeleton={nodes.Object_9.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_10.geometry}
                  material={materials.Discs}
                  skeleton={nodes.Object_10.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_11.geometry}
                  material={materials.Ribs}
                  skeleton={nodes.Object_11.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_12.geometry}
                  material={materials.Sternum}
                  skeleton={nodes.Object_12.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_13.geometry}
                  material={materials.RibCartilage}
                  skeleton={nodes.Object_13.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_14.geometry}
                  material={materials.Spine}
                  skeleton={nodes.Object_14.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_15.geometry}
                  material={materials.Hyoid}
                  skeleton={nodes.Object_15.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_16.geometry}
                  material={materials.Cranium}
                  skeleton={nodes.Object_16.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_17.geometry}
                  material={materials.UpperTeeth}
                  skeleton={nodes.Object_17.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_18.geometry}
                  material={materials.Mandible}
                  skeleton={nodes.Object_18.skeleton}
                />
                <skinnedMesh
                  geometry={nodes.Object_19.geometry}
                  material={materials.LowerTeeth}
                  skeleton={nodes.Object_19.skeleton}
                />
                <group />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/male_skeleton.glb'));
