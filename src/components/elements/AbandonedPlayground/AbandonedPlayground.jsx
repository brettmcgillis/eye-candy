import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AbandonedPlayground({ animated = false, ...props }) {
  const group = React.useRef();
  const { nodes, materials, animations } = useGLTF(
    modelFile('abandoned_playground.glb')
  );
  const { actions } = useAnimations(animations, group);

  // Ghost town, but the swings still creak: play every baked clip when the
  // consumer opts in.
  React.useEffect(() => {
    if (!animated) return undefined;
    const active = Object.values(actions).filter(Boolean);
    active.forEach((action) => {
      action.reset().play();
    });
    return () => {
      active.forEach((action) => action.stop());
    };
  }, [actions, animated]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="RootNode" scale={0.001}>
          <group
            name="Cylinder007"
            position={[-22.565, 1715.997, -2706.335]}
            rotation={[0, 0, Math.PI / 9]}
            scale={[0.847, 0.847, 1]}
          >
            <mesh
              name="Cylinder007__0"
              castShadow
              receiveShadow
              geometry={nodes.Cylinder007__0.geometry}
              material={materials['Scene_-_Root']}
            />
          </group>
          <group
            name="Cylinder008"
            position={[-22.565, 1715.997, -1258.375]}
            rotation={[0, 0, -Math.PI / 9]}
            scale={[0.847, 0.847, 1]}
          >
            <mesh
              name="Cylinder008__0"
              castShadow
              receiveShadow
              geometry={nodes.Cylinder008__0.geometry}
              material={materials['Scene_-_Root']}
            />
          </group>
        </group>
        <group
          name="Group001"
          position={[1.126, 0.447, -0.238]}
          rotation={[-Math.PI / 2, 0, 0.839]}
          scale={0.001}
        >
          <group
            name="Cylinder003"
            position={[0, 46.932, -17.184]}
            rotation={[-Math.PI, 1.222, -1.178]}
          >
            <group name="Object_14" position={[0, 0, -1250]}>
              <mesh
                name="Cylinder003__0"
                castShadow
                receiveShadow
                geometry={nodes.Cylinder003__0.geometry}
                material={materials['Scene_-_Root']}
              />
            </group>
          </group>
        </group>
        <mesh
          name="Circle002__0"
          castShadow
          receiveShadow
          geometry={nodes.Circle002__0.geometry}
          material={materials['Scene_-_Root']}
          position={[-1.824, 0.004, 0.122]}
          rotation={[0, 1.092, 0]}
          scale={0.001}
        />
        <mesh
          name="Cylinder006__0"
          castShadow
          receiveShadow
          geometry={nodes.Cylinder006__0.geometry}
          material={materials['Scene_-_Root']}
          position={[0.531, 0, -3.261]}
          rotation={[-Math.PI / 2, -0.262, Math.PI]}
          scale={0.001}
        />
        <mesh
          name="Line001__0"
          castShadow
          receiveShadow
          geometry={nodes.Line001__0.geometry}
          material={materials['Scene_-_Root']}
          position={[1.209, 0.2, -0.164]}
          rotation={[Math.PI, -0.839, -Math.PI]}
          scale={0.001}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('abandoned_playground.glb'));
