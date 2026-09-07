import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { createHallway, createShaftFloor } from '@modules/houseOfLeaves';

import createShaftFloorZone from '../utils/zones/shaftFloor';

// The bottom of the shaft, and every way out of it: hallways leaving like
// spokes on a wagon wheel, all dark, none of them hinting which is the way on.
//
// The doorways come from the zone rather than being derived again here, so the
// opening the walker can walk through is the same one that was cut.
function ShaftFloor({ config, material, walker }) {
  const groupRef = useRef(null);
  const zone = useMemo(() => createShaftFloorZone(config), [config]);

  const parts = useMemo(
    () => ({
      floor: createShaftFloor({
        radius: zone.wallRadius,
        skirtHeight: config.floorSkirt,
        doorways: zone.exits,
      }),
      spokes: zone.exits.map((exit) =>
        createHallway({
          length: config.floorSpokeLength,
          width: exit.width,
          height: exit.height,
          archRise: exit.archRise,
          revealDepth: config.revealDepth,
          mouthCurveRadius: zone.wallRadius,
        })
      ),
    }),
    [config.floorSkirt, config.floorSpokeLength, config.revealDepth, zone]
  );

  useEffect(
    () => () => {
      parts.floor.dispose();
      parts.spokes.forEach((geometry) => geometry.dispose());
    },
    [parts]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { anchor } = walker;
    group.position.set(
      config.origin.x - anchor.x,
      -anchor.y,
      config.origin.z - anchor.z
    );
  });

  return (
    <group ref={groupRef}>
      <mesh
        castShadow
        geometry={parts.floor}
        material={material}
        receiveShadow
      />
      {zone.exits.map((exit, i) => (
        <mesh
          castShadow
          geometry={parts.spokes[i]}
          key={exit.angle}
          material={material}
          position={[
            Math.cos(exit.angle) * zone.wallRadius,
            0,
            Math.sin(exit.angle) * zone.wallRadius,
          ]}
          receiveShadow
          rotation={[0, -exit.angle, 0]}
        />
      ))}
    </group>
  );
}

export default memo(ShaftFloor);
