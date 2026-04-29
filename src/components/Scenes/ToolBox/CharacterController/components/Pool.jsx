import React, { useMemo } from 'react';

import { useThree } from '@react-three/fiber';
import { InstancedRigidBodies, RigidBody } from '@react-three/rapier';

const FLOOR_Y = -1;
const POOL_CENTER = [-28, 10];
const INNER_SIZE = 10;
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 2;
const FLOOR_THICKNESS = 0.4;
const SPHERE_RADIUS = 0.3;
const POOL_WALL_CENTER_Y = FLOOR_Y + WALL_HEIGHT / 2 - 0.02;
const POOL_FLOOR_Y = FLOOR_Y - 0.8;
const WALL_TOP_Y = POOL_WALL_CENTER_Y + WALL_HEIGHT / 2;
const RAMP_HALF_RUN = 2.1;
const RAMP_Y = (POOL_FLOOR_Y + WALL_TOP_Y) / 2;
const RAMP_ANGLE = Math.PI * 0.17;
const RAMP_SIZE = [4.6, 0.35, 2.4];

export default function Pool() {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;

  const sphereConfigs = useMemo(() => {
    const configs = [];
    const columns = isWebGPU ? 6 : 7;
    const rows = isWebGPU ? 6 : 7;
    const layers = isWebGPU ? 3 : 4;
    const spacing = SPHERE_RADIUS * 2.15;

    const baseX = POOL_CENTER[0] - ((columns - 1) * spacing) / 2;
    const baseZ = POOL_CENTER[1] - ((rows - 1) * spacing) / 2;
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
  }, [isWebGPU]);

  return (
    <group>
      {/* Pool floor */}
      <RigidBody type="fixed" friction={1.25} restitution={0.05}>
        <mesh
          receiveShadow
          position={[POOL_CENTER[0], POOL_FLOOR_Y, POOL_CENTER[1]]}
        >
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
            POOL_CENTER[0],
            POOL_WALL_CENTER_Y,
            POOL_CENTER[1] - INNER_SIZE / 2,
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
            POOL_CENTER[0],
            POOL_WALL_CENTER_Y,
            POOL_CENTER[1] + INNER_SIZE / 2,
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
            POOL_CENTER[0] - INNER_SIZE / 2,
            POOL_WALL_CENTER_Y,
            POOL_CENTER[1],
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
            POOL_CENTER[0] + INNER_SIZE / 2,
            POOL_WALL_CENTER_Y,
            POOL_CENTER[1],
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
            POOL_CENTER[0],
            RAMP_Y,
            POOL_CENTER[1] + INNER_SIZE / 2 - RAMP_HALF_RUN,
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
            POOL_CENTER[0],
            RAMP_Y,
            POOL_CENTER[1] + INNER_SIZE / 2 + RAMP_HALF_RUN,
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
        linearDamping={0.08}
        angularDamping={0.1}
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
