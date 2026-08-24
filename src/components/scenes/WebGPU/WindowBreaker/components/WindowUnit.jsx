import React, { memo, useMemo } from 'react';

import { RigidBody } from '@react-three/rapier';

import DestructiblePane from './DestructiblePane';

const QUADRANTS = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

const LIP_DEPTH = 0.05;

// Builds a glazing channel: deep structural bars (border + mullion cross) that
// form the pocket walls and sill, plus thin front/back lips that overhang the
// glass edges so the pane sits in a groove and broken shards are trapped
// between the two lips instead of dropping clean through.
function buildBars(width, height, thickness, depth) {
  const hw = width / 2;
  const hh = height / 2;
  const front = depth / 2 - LIP_DEPTH / 2;
  const lipT = thickness * 2.2;

  const structural = [
    { position: [0, hh, 0], args: [width, thickness, depth] },
    { position: [0, -hh, 0], args: [width, thickness, depth] },
    { position: [-hw, 0, 0], args: [thickness, height, depth] },
    { position: [hw, 0, 0], args: [thickness, height, depth] },
    { position: [0, 0, 0], args: [thickness, height, depth] },
    { position: [0, 0, 0], args: [width, thickness, depth] },
  ];

  const lipLayer = (z) => [
    { position: [0, hh, z], args: [width, lipT, LIP_DEPTH] },
    { position: [0, -hh, z], args: [width, lipT, LIP_DEPTH] },
    { position: [-hw, 0, z], args: [lipT, height, LIP_DEPTH] },
    { position: [hw, 0, z], args: [lipT, height, LIP_DEPTH] },
    { position: [0, 0, z], args: [lipT, height, LIP_DEPTH] },
    { position: [0, 0, z], args: [width, lipT, LIP_DEPTH] },
  ];

  return structural.concat(lipLayer(front), lipLayer(-front));
}

function WindowUnit({
  slot,
  width,
  height,
  glass,
  frame,
  runtime,
  registerPane,
}) {
  // Glass runs a touch under the lips so its edges are actually held.
  const paneWidth = Math.max(width / 2 - frame.thickness * 0.5, 0.05);
  const paneHeight = Math.max(height / 2 - frame.thickness * 0.5, 0.05);

  const bars = useMemo(
    () => buildBars(width, height, frame.thickness, frame.depth),
    [width, height, frame.thickness, frame.depth]
  );

  return (
    <group position={slot.position} quaternion={slot.quaternion}>
      <RigidBody
        type="fixed"
        colliders="cuboid"
        friction={0.9}
        restitution={0.1}
      >
        {bars.map((bar, barIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <mesh key={barIndex} castShadow receiveShadow position={bar.position}>
            <boxGeometry args={bar.args} />
            <meshStandardMaterial
              color={frame.color}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        ))}
      </RigidBody>

      {QUADRANTS.map(([sx, sy], index) => (
        <group
          key={`${slot.id}-q${index}`}
          position={[(sx * width) / 4, (sy * height) / 4, 0]}
        >
          <DestructiblePane
            paneKey={`${slot.id}-q${index}`}
            width={paneWidth}
            height={paneHeight}
            glass={glass}
            runtime={runtime}
            registerPane={registerPane}
          />
        </group>
      ))}
    </group>
  );
}

export default memo(WindowUnit);
