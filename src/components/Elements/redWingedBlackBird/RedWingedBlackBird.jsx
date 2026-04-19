import React, { useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function RedWingedBlackBird(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('/red-winged_blackbird.glb')
  );
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group
                name="perchedWings005_0"
                position={[-0.023, 0.056, -0.022]}
                rotation={[-Math.PI, 0, -Math.PI]}
              >
                <mesh
                  name="Object_4"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_4.geometry}
                  material={materials.RedWingedBlackbirdFullComp_mat}
                />
              </group>
              <group
                name="perchedLegs004_1"
                position={[-0.009, 0, 0.008]}
                rotation={[-Math.PI, 0, -Math.PI]}
              >
                <mesh
                  name="Object_6"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_6.geometry}
                  material={materials.RedWingedBlackbirdFullComp_mat}
                />
              </group>
              <group
                name="perchedWings014_2"
                position={[0.023, 0.056, -0.022]}
                rotation={[-Math.PI, 0, -Math.PI]}
              >
                <mesh
                  name="Object_8"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_8.geometry}
                  material={materials.RedWingedBlackbirdFullComp_mat}
                />
              </group>
              <group
                name="perchedLegs010_3"
                position={[0.009, 0, 0.008]}
                rotation={[-Math.PI, 0, -Math.PI]}
              >
                <mesh
                  name="Object_10"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_10.geometry}
                  material={materials.RedWingedBlackbirdFullComp_mat}
                />
              </group>
              <group name="Armature_9">
                <group name="GLTF_created_0">
                  <primitive object={nodes.GLTF_created_0_rootJoint} />
                  <skinnedMesh
                    name="Object_15"
                    geometry={nodes.Object_15.geometry}
                    material={materials.RedWingedBlackbirdFullComp_mat}
                    skeleton={nodes.Object_15.skeleton}
                  />
                  <group name="perchedBody016_8" />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/red-winged_blackbird.glb'));
