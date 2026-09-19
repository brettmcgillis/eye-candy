import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createLivingRoom } from '@modules/houseOfLeaves';

import Furniture from './Furniture';

const scratch = { toDoor: new THREE.Vector3(), forward: new THREE.Vector3() };

// The ordinary room, and the house's one trick. Its north wall exists in two
// versions, whole and with the doorway, and swaps only while the wall is out
// of frame: the house rearranges itself unobserved, and a timer would
// eventually fire in view.
function LivingRoom({ config, material, walker, zone }) {
  const groupRef = useRef(null);
  const camera = useThree((state) => state.camera);
  const [open, setOpen] = useState(zone.doorState.open);

  const geometries = useMemo(
    () => ({
      closed: createLivingRoom({
        depth: zone.depth,
        width: zone.width,
        height: zone.height,
        wallThickness: config.wallThickness,
        door: zone.door,
        open: false,
      }),
      open: createLivingRoom({
        depth: zone.depth,
        width: zone.width,
        height: zone.height,
        wallThickness: config.wallThickness,
        door: zone.door,
        open: true,
      }),
    }),
    [config.wallThickness, zone]
  );
  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries]
  );

  useFrame(() => {
    const group = groupRef.current;
    const { anchor } = walker;
    const { frame } = zone;
    if (group) {
      group.position.set(
        frame.x - anchor.x,
        frame.y - anchor.y,
        frame.z - anchor.z
      );
      group.rotation.y = frame.rotationY;
    }
    const state = zone.doorState;
    if (!state.pending()) return;
    // Out of frame: the wall's centre is further off the view axis than half
    // the field of view plus what the wall's width subtends, or behind us.
    const door = zone.doorWorld();
    const { toDoor, forward } = scratch;
    toDoor
      .set(door.x - anchor.x, door.y - anchor.y, door.z - anchor.z)
      .sub(camera.position);
    const distance = toDoor.length();
    camera.getWorldDirection(forward);
    const cos = toDoor.normalize().dot(forward);
    const halfFov = (camera.fov * Math.PI) / 360;
    const aspect = camera.aspect || 1.7;
    const subtends = Math.atan2(zone.width * 0.5, Math.max(0.5, distance));
    const limit = Math.cos(halfFov * Math.max(1, aspect) + subtends + 0.15);
    if (cos < limit) {
      state.settle();
      setOpen(state.open);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        castShadow
        geometry={open ? geometries.open : geometries.closed}
        material={material}
        receiveShadow
      />
      <Furniture config={config} zone={zone} />
    </group>
  );
}

export default memo(LivingRoom);
