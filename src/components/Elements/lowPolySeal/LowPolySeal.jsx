import React, { useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function LowPolySeal(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(modelFile('/seal.glb'));
  const { actions } = useAnimations(animations, group);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group
          name="Sketchfab_model"
          scale={[0.5, 0.5, 0.5]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="SealArmature_15">
                <group name="GLTF_created_0">
                  <primitive object={nodes.GLTF_created_0_rootJoint} />
                  <skinnedMesh
                    name="Object_7"
                    geometry={nodes.Object_7.geometry}
                    material={materials.Seal}
                    skeleton={nodes.Object_7.skeleton}
                  />
                  <group name="Seal_14" />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/seal.glb'));
