/* eslint-disable no-underscore-dangle */
import React, { useEffect, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function TigerShark(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('/tigerShark.glb')
  );
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions ?? {}).forEach((action) => {
      action.reset();
      action.fadeIn(0.35);
      action.play();
    });

    return () => {
      Object.values(actions ?? {}).forEach((action) => {
        action.fadeOut(0.2);
        action.stop();
      });
    };
  }, [actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group name="Tiger_Shark_2fbx" rotation={[Math.PI / 2, 0, 0]}>
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="Hemi"
                  position={[0, -124.661, 0]}
                  rotation={[0, 0, Math.PI]}
                  scale={100}
                >
                  <group name="Object_5" rotation={[Math.PI / 2, 0, 0]}>
                    <group name="Object_6" />
                  </group>
                </group>
                <group
                  name="Sun"
                  position={[209.518, 114.514, 0]}
                  rotation={[0, -0.58, -0.95]}
                  scale={100}
                >
                  <group name="Object_8" rotation={[Math.PI / 2, 0, 0]}>
                    <group name="Object_9" />
                  </group>
                </group>
                <group
                  name="Armature"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                >
                  <group name="Object_11">
                    <primitive object={nodes._rootJoint} />
                    <skinnedMesh
                      name="Object_83"
                      geometry={nodes.Object_83.geometry}
                      material={materials.Tiger_shark}
                      skeleton={nodes.Object_83.skeleton}
                    />
                    <group
                      name="Object_82"
                      rotation={[-Math.PI / 2, 0, 0]}
                      scale={100}
                    />
                  </group>
                </group>
                <group
                  name="TIGER_SHARK_lowpoly"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                />
                <group name="Cube" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh
                    name="Cube__0"
                    castShadow
                    receiveShadow
                    geometry={nodes.Cube__0.geometry}
                    material={materials.Cube__0}
                  />
                </group>
                <group
                  name="Empty_SPHERE"
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

useGLTF.preload(modelFile('/tigerShark.glb'));
