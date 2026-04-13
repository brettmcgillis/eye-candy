/* eslint-disable no-underscore-dangle */
import React, { useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Rabbit(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(modelFile('/rabbit.glb'));
  const { actions } = useAnimations(animations, group);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group
            name="7d743f0a63c8458d8915d7ce169c8c60fbx"
            rotation={[Math.PI / 2, 0, 0]}
            scale={0.01}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="Rabbit"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                >
                  <group name="Object_5">
                    <primitive object={nodes._rootJoint} />
                    <skinnedMesh
                      name="Object_72"
                      geometry={nodes.Object_72.geometry}
                      material={materials.Rabbit}
                      skeleton={nodes.Object_72.skeleton}
                    />
                    <group
                      name="Object_71"
                      rotation={[-Math.PI / 2, 0, 0]}
                      scale={100}
                    />
                  </group>
                </group>
                <group
                  name="Rabbit001"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/rabbit.glb'));
