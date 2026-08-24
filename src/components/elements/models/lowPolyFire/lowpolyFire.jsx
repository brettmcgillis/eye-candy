import React, { useEffect, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function LowPolyFire(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('/low_poly_fire.glb')
  );
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const animationActions = Object.values(actions);
    animationActions.forEach((action) => {
      action.reset();
      action.play();
    });

    return () => {
      animationActions.forEach((action) => action.stop());
    };
  }, [actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="Fire_0">
                <mesh
                  name="Object_4"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_4.geometry}
                  material={materials.Amarelo}
                />
                <mesh
                  name="Object_5"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_5.geometry}
                  material={materials.Laranja}
                />
                <mesh
                  name="Object_6"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_6.geometry}
                  material={materials.Vermelho}
                />
              </group>
              <group
                name="Ember001_1"
                position={[-0.761, 4.13, -1.729]}
                scale={0.8}
              >
                <mesh
                  name="Object_8"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_8.geometry}
                  material={materials.Laranja}
                />
                <mesh
                  name="Object_9"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_9.geometry}
                  material={materials.Amarelo}
                />
              </group>
              <group name="Ember_2" position={[0.785, 2.44, 0.094]}>
                <mesh
                  name="Object_11"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_11.geometry}
                  material={materials.Amarelo}
                />
                <mesh
                  name="Object_12"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_12.geometry}
                  material={materials.Vermelho}
                />
              </group>
              <group
                name="Ember002_3"
                position={[0.125, 2.324, 0.303]}
                scale={0.995}
              >
                <mesh
                  name="Object_14"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_14.geometry}
                  material={materials.Laranja}
                />
                <mesh
                  name="Object_15"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_15.geometry}
                  material={materials.Amarelo}
                />
              </group>
              <group
                name="Ember003_4"
                position={[0.156, 3.2, 0.933]}
                scale={0.98}
              >
                <mesh
                  name="Object_17"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_17.geometry}
                  material={materials.Vermelho}
                />
                <mesh
                  name="Object_18"
                  castShadow
                  receiveShadow
                  geometry={nodes.Object_18.geometry}
                  material={materials.Laranja}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/low_poly_fire.glb'));
