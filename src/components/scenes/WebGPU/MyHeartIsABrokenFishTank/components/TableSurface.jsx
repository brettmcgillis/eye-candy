import React, { useMemo } from 'react';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import WoodMaterial from '@materials/WebGPU/WoodMaterial';

import { getTableLayout } from '../utils/sceneLayout';

export default function TableSurface({ collisionMeshesRef, table, tank }) {
  const tableLayout = useMemo(
    () => getTableLayout(tank, table),
    [
      table.depth,
      table.legs?.depth,
      table.legs?.inset,
      table.legs?.width,
      table.position,
      table.thickness,
      table.width,
      tank.depth,
      tank.glassThickness,
      tank.height,
      tank.spillExtent,
      tank.width,
    ]
  );
  const woodMaterialProps = useMemo(
    () => ({
      barkThickness: table.wood.barkThickness,
      cellScale: table.wood.cellScale,
      cellSize: table.wood.cellSize,
      centerSize: table.wood.centerSize,
      clearcoat: table.wood.clearcoat,
      clearcoatRoughness: table.wood.clearcoatRoughness,
      darkGrainColor: table.wood.darkGrainColor,
      fallbackColor: table.color,
      fineWarpScale: table.wood.fineWarpScale,
      fineWarpStrength: table.wood.fineWarpStrength,
      grainOffset: table.wood.grainOffset,
      grainRotation: table.wood.grainRotation,
      grainScale: table.wood.grainScale,
      largeGrainStretch: table.wood.largeGrainStretch,
      largeWarpScale: table.wood.largeWarpScale,
      lightGrainColor: table.wood.lightGrainColor,
      metalness: table.metalness,
      ringBias: table.wood.ringBias,
      ringSizeVariance: table.wood.ringSizeVariance,
      ringThickness: table.wood.ringThickness,
      ringVarianceScale: table.wood.ringVarianceScale,
      roughness: table.roughness,
      smallWarpScale: table.wood.smallWarpScale,
      smallWarpStrength: table.wood.smallWarpStrength,
      splotchIntensity: table.wood.splotchIntensity,
      splotchScale: table.wood.splotchScale,
    }),
    [
      table.color,
      table.metalness,
      table.roughness,
      table.wood.barkThickness,
      table.wood.cellScale,
      table.wood.cellSize,
      table.wood.centerSize,
      table.wood.clearcoat,
      table.wood.clearcoatRoughness,
      table.wood.darkGrainColor,
      table.wood.fineWarpScale,
      table.wood.fineWarpStrength,
      table.wood.grainOffset,
      table.wood.grainRotation,
      table.wood.grainScale,
      table.wood.largeGrainStretch,
      table.wood.largeWarpScale,
      table.wood.lightGrainColor,
      table.wood.ringBias,
      table.wood.ringSizeVariance,
      table.wood.ringThickness,
      table.wood.ringVarianceScale,
      table.wood.smallWarpScale,
      table.wood.smallWarpStrength,
      table.wood.splotchIntensity,
      table.wood.splotchScale,
    ]
  );

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={tableLayout.topHalfExtents}
          position={tableLayout.topPosition}
          friction={1.25}
          restitution={0.04}
        />
        {tableLayout.legs.map((leg) => (
          <CuboidCollider
            key={leg.key}
            args={leg.halfExtents}
            position={leg.position}
            friction={1.22}
            restitution={0.03}
          />
        ))}
        {tableLayout.edgeColliders.map((edge) => (
          <CuboidCollider
            key={edge.key}
            args={edge.args}
            position={edge.position}
            friction={1.28}
            restitution={0.03}
          />
        ))}
      </RigidBody>

      <mesh
        ref={(node) => {
          const collisionMeshes = collisionMeshesRef.current;

          collisionMeshes[0] = node;

          if (node) {
            const tableNode = node;

            tableNode.userData = {
              ...tableNode.userData,
              surfaceType: 'table-top',
            };
          }
        }}
        castShadow
        position={tableLayout.topPosition}
        receiveShadow
      >
        <boxGeometry
          args={[tableLayout.width, tableLayout.thickness, tableLayout.depth]}
        />
        <WoodMaterial
          {...woodMaterialProps}
          dimensions={[
            tableLayout.width,
            tableLayout.thickness,
            tableLayout.depth,
          ]}
        />
      </mesh>

      {tableLayout.legs.map((leg, index) => (
        <mesh
          key={leg.key}
          ref={(node) => {
            const collisionMeshes = collisionMeshesRef.current;

            collisionMeshes[index + 1] = node;

            if (node) {
              const tableNode = node;

              tableNode.userData = {
                ...tableNode.userData,
                surfaceType: 'table-leg',
              };
            }
          }}
          castShadow
          position={leg.position}
          receiveShadow
        >
          <boxGeometry args={leg.size} />
          <WoodMaterial {...woodMaterialProps} dimensions={leg.size} />
        </mesh>
      ))}
    </>
  );
}
