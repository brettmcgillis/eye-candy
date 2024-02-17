import React from 'react';

import { useGLTF } from '@react-three/drei';

import dumpster from 'models/Dumpster.glb';

export default function Dumpster({
  rightLidVisible = true,
  rightLidRotation = Math.PI / 4,
  leftLidVisible = true,
  leftLidRotation = 1.833,
  frontLeftWheelRotation = Math.PI,
  frontRightWheelRotation = 0,
  rearLeftWheelRotation = Math.PI,
  rearRightWheelRotation = 0,
  ...props
}) {
  const { nodes, materials } = useGLTF(dumpster);
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="Model">
          <group name="Base" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
            <group name="Root">
              <group name="Dumpster" rotation={[-Math.PI, 0, 0]}>
                <group name="Container" position={[0, 2.238, 122.206]}>
                  <group
                    name="C1"
                    position={[90, -49.761, -24.038]}
                    rotation={[0, -1.571, 0]}
                  >
                    <mesh
                      name="C2"
                      castShadow
                      receiveShadow
                      geometry={nodes.C2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  name="FrontLeftWheel"
                  position={[-83.16, -30, 16.669]}
                  rotation={[0, 0, frontLeftWheelRotation]}
                >
                  <group
                    name="FLW1"
                    position={[6.84, -17.523, 81.499]}
                    rotation={[0, -1.571, 0]}
                  >
                    <mesh
                      name="FLW2"
                      castShadow
                      receiveShadow
                      geometry={nodes.FLW2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  name="FrontRightWheel"
                  position={[83.16, -30, 16.669]}
                  rotation={[0, 0, frontRightWheelRotation]}
                >
                  <group
                    name="FRW1"
                    position={[6.84, -17.523, 81.499]}
                    rotation={[0, -1.571, 0]}
                  >
                    <mesh
                      name="FRW2"
                      castShadow
                      receiveShadow
                      geometry={nodes.FRW2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  visible={leftLidVisible}
                  name="LeftLid"
                  position={[-47.5, 51.999, 146.244]}
                  rotation={[leftLidRotation, 0, 0]}
                >
                  <group name="LL1" position={[0, 0.3, 51.276]}>
                    <mesh
                      name="LL2"
                      castShadow
                      receiveShadow
                      geometry={nodes.LL2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  name="RearLeftWheel"
                  position={[-83.16, 30, 16.669]}
                  rotation={[0, 0, rearLeftWheelRotation]}
                >
                  <group
                    name="RLW1"
                    position={[6.84, -17.523, 81.499]}
                    rotation={[0, -1.571, 0]}
                  >
                    <mesh
                      name="RLW2"
                      castShadow
                      receiveShadow
                      geometry={nodes.RLW2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  name="RearRightWheel"
                  position={[83.16, 33.131, 16.669]}
                  rotation={[0, 0, rearRightWheelRotation]}
                >
                  <group
                    name="RRW1"
                    position={[6.84, -17.523, 81.499]}
                    rotation={[0, -1.571, 0]}
                  >
                    <mesh
                      name="RRW2"
                      castShadow
                      receiveShadow
                      geometry={nodes.RRW2.geometry}
                      material={materials['Dumpster_02.001']}
                    />
                  </group>
                </group>
                <group
                  name="RightLid"
                  visible={rightLidVisible}
                  position={[47.5, 51.999, 146.244]}
                  rotation={[rightLidRotation, 0, 0]}
                >
                  <group name="RL1" position={[0, 0.3, 51.276]}>
                    <mesh
                      name="RL2"
                      castShadow
                      receiveShadow
                      geometry={nodes.RL2.geometry}
                      material={materials['Dumpster_02.001']}
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

useGLTF.preload('models/Dumpster.glb');
