/* eslint-disable no-underscore-dangle */
import React, { useEffect, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function HammerHead(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('/hammerHead.glb')
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
          <group
            name="bac65c2aa79a4a3a9500cef32dd8cf74fbx"
            rotation={[Math.PI / 2, 0, 0]}
            scale={0.01}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="Cube"
                  position={[0, 0.712, 9.972]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={24.02}
                />
                <group
                  name="Armature"
                  position={[-0.434, 1.731, 100.544]}
                  rotation={[-Math.PI, 0, 0]}
                  scale={100}
                >
                  <group name="Object_6">
                    <primitive object={nodes._rootJoint} />
                    <skinnedMesh
                      name="Object_9"
                      geometry={nodes.Object_9.geometry}
                      material={materials.Material}
                      skeleton={nodes.Object_9.skeleton}
                    />
                    <group
                      name="Object_8"
                      position={[0, 0.712, 9.972]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      scale={24.02}
                    />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/hammerHead.glb'));
