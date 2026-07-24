/* eslint-disable no-underscore-dangle */
import React, { useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../utils/appUtils';

export default function TadpolCopter(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('/tadpolicopter.glb')
  );
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group
            name="81cf8717a5f449869dd4721f24c828cbfbx"
            rotation={[Math.PI / 2, 0, 0]}
            scale={0.01}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group name="Object_4">
                  <primitive object={nodes._rootJoint} />
                  <skinnedMesh
                    name="Object_7"
                    geometry={nodes.Object_7.geometry}
                    material={materials.Standardmaterial}
                    skeleton={nodes.Object_7.skeleton}
                  />
                  <skinnedMesh
                    name="Object_9"
                    geometry={nodes.Object_9.geometry}
                    material={materials.Standardmaterial}
                    skeleton={nodes.Object_9.skeleton}
                  />
                  <group name="Object_6" rotation={[-Math.PI / 2, 0, 0]} />
                  <group
                    name="Object_8"
                    position={[0, 13.675, -0.821]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  />
                  <group name="rena_body" rotation={[-Math.PI / 2, 0, 0]} />
                  <group
                    name="rena_blades"
                    position={[0, 13.675, -0.821]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/tadpolicopter.glb'));
