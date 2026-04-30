import React, { useMemo } from 'react';

import { useThree } from '@react-three/fiber';
import { InstancedRigidBodies, RigidBody } from '@react-three/rapier';

const FLOOR_Y = -1;
const INNER_SIZE = 10;
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 2;
const FLOOR_THICKNESS = 0.4;
const SPHERE_RADIUS = 0.3;
const POOL_WALL_CENTER_Y = FLOOR_Y + WALL_HEIGHT / 2; // bottom face at FLOOR_Y, top at FLOOR_Y + WALL_HEIGHT
const POOL_FLOOR_Y = FLOOR_Y - FLOOR_THICKNESS / 2 + 0.005; // top face 5mm above grid plane to prevent z-fighting
const WALL_TOP_Y = FLOOR_Y + WALL_HEIGHT; // = 1.0
const RAMP_HALF_RUN = 2.8;
const RAMP_Y = (FLOOR_Y + WALL_TOP_Y) / 2; // = 0.0
const RAMP_ANGLE = Math.atan(WALL_HEIGHT / (RAMP_HALF_RUN * 2)); // ≈ 19.7°
const RAMP_SIZE = [6.0, 0.35, 2.4];

export default function Pool({ position = [-28, 0, 10] }) {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;

  const sphereConfigs = useMemo(() => {
    const configs = [];
    const columns = isWebGPU ? 6 : 7;
    const rows = isWebGPU ? 6 : 7;
    const layers = isWebGPU ? 3 : 4;
    const spacing = SPHERE_RADIUS * 2.15;

    const baseX = position[0] - ((columns - 1) * spacing) / 2;
    const baseZ = position[2] - ((rows - 1) * spacing) / 2;
    const baseY = POOL_FLOOR_Y + FLOOR_THICKNESS / 2 + SPHERE_RADIUS + 0.05;

    let id = 0;
    for (let layer = 0; layer < layers; layer += 1) {
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          configs.push({
            key: `pool-sphere-${id}`,
            position: [
              baseX + column * spacing,
              baseY + layer * spacing,
              baseZ + row * spacing,
            ],
          });
          id += 1;
        }
      }
    }

    return configs;
  }, [isWebGPU, position[0], position[2]]);

  return (
    <group>
      {/* Pool floor */}
      <RigidBody type="fixed" friction={1.25} restitution={0.05}>
        <mesh receiveShadow position={[position[0], POOL_FLOOR_Y, position[2]]}>
          <boxGeometry
            args={[
              INNER_SIZE + WALL_THICKNESS * 2,
              FLOOR_THICKNESS,
              INNER_SIZE + WALL_THICKNESS * 2,
            ]}
          />
          <meshStandardMaterial color="lightblue" />
        </mesh>
      </RigidBody>

      {/* Pool walls */}
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          position={[
            position[0],
            POOL_WALL_CENTER_Y,
            position[2] - INNER_SIZE / 2,
          ]}
        >
          <boxGeometry args={[INNER_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="powderblue" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          position={[
            position[0],
            POOL_WALL_CENTER_Y,
            position[2] + INNER_SIZE / 2,
          ]}
        >
          <boxGeometry args={[INNER_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="powderblue" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          position={[
            position[0] - INNER_SIZE / 2,
            POOL_WALL_CENTER_Y,
            position[2],
          ]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, INNER_SIZE]} />
          <meshStandardMaterial color="powderblue" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          position={[
            position[0] + INNER_SIZE / 2,
            POOL_WALL_CENTER_Y,
            position[2],
          ]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, INNER_SIZE]} />
          <meshStandardMaterial color="powderblue" />
        </mesh>
      </RigidBody>

      {/* Internal ramp up to the wall top */}
      <RigidBody type="fixed" friction={1.25}>
        <mesh
          receiveShadow
          position={[
            position[0],
            RAMP_Y,
            position[2] + INNER_SIZE / 2 - RAMP_HALF_RUN,
          ]}
          rotation={[-RAMP_ANGLE, Math.PI / 2, 0]}
        >
          <boxGeometry args={RAMP_SIZE} />
          <meshStandardMaterial color="lightpink" />
        </mesh>
      </RigidBody>

      {/* External ramp down from wall top to ground */}
      <RigidBody type="fixed" friction={1.25}>
        <mesh
          receiveShadow
          position={[
            position[0],
            RAMP_Y,
            position[2] + INNER_SIZE / 2 + RAMP_HALF_RUN,
          ]}
          rotation={[RAMP_ANGLE, Math.PI / 2, 0]}
        >
          <boxGeometry args={RAMP_SIZE} />
          <meshStandardMaterial color="lightpink" />
        </mesh>
      </RigidBody>

      {/* Half-filled sphere pit */}
      <InstancedRigidBodies
        instances={sphereConfigs}
        colliders="ball"
        mass={0.1}
      >
        <instancedMesh
          receiveShadow={false}
          castShadow={false}
          frustumCulled={false}
          args={[undefined, undefined, sphereConfigs.length]}
        >
          <sphereGeometry args={[SPHERE_RADIUS, 10, 10]} />
          <meshStandardMaterial color="lightseagreen" />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  );
}
