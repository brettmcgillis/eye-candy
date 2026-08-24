import React from 'react';

export function CrtStageFloor({
  color = '#111111',
  metalness = 0.2,
  position = [0, -0.02, 0],
  roughness = 0.92,
  rotation = [-Math.PI / 2, 0, 0],
  size = 30,
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

export function CrtChannelPanels({
  boardColor = '#7a5337',
  boardMetalness = 0.03,
  boardRoughness = 0.92,
  panels,
  columns = 3,
  panelHeight = 2,
  panelWidth = 2,
  spacingX = 3.3,
  spacingZ = 2.8,
}) {
  const rowCount = Math.ceil(panels.length / columns);
  const columnOffset = (columns - 1) / 2;
  const rowOffset = (rowCount - 1) / 2;

  return (
    <group>
      {panels.map((panel, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = (column - columnOffset) * spacingX;
        const z = (row - rowOffset) * spacingZ;
        const boardTilt = (column - columnOffset) * 0.025;

        return (
          <group
            key={panel.key}
            position={[x, 0.08, z]}
            rotation={[-Math.PI / 2, 0, boardTilt]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry
                args={[panelWidth + 0.48, panelHeight + 0.48, 0.16]}
              />
              <meshStandardMaterial
                color={boardColor}
                metalness={boardMetalness}
                roughness={boardRoughness}
              />
            </mesh>

            <mesh position={[0, 0, 0.081]}>
              <planeGeometry args={[panelWidth, panelHeight]} />
              {panel.video}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
