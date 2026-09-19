import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { createShaftFloor } from '@modules/houseOfLeaves';

import createShaftGrid from '../utils/shaftGrid';

// The bottom of the shaft, and every way out of it. Built on the shaft's
// grid so its top ring is the streamed wall's own row, in the shaft's frame.
function ShaftFloor({ config, material, walker, zone }) {
  const groupRef = useRef(null);
  const grid = useMemo(() => createShaftGrid(config.shaft), [config.shaft]);

  const geometry = useMemo(
    () =>
      createShaftFloor({
        ring: grid.ring,
        inward: grid.inward,
        rowTop: config.shaftRows.rowTop,
        rowFloor: config.shaftRows.rowFloor,
        cols: grid.cols,
        centre: zone.centre,
        exits: zone.exits,
        radius: zone.wallRadius,
        spokeLength: config.spokeLength,
      }),
    [config.shaftRows, config.spokeLength, grid, zone]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { anchor } = walker;
    const { frame } = zone;
    group.position.set(
      frame.x - anchor.x,
      frame.y - anchor.y,
      frame.z - anchor.z
    );
    group.rotation.y = frame.rotationY;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow geometry={geometry} material={material} receiveShadow />
    </group>
  );
}

export default memo(ShaftFloor);
