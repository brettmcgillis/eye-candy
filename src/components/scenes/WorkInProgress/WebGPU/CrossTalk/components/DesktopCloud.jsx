import React, { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { SingleCartoonCloud } from '../../../../../elements/CartoonClouds/CartoonClouds';

const EASING = 0.06;
// Average X extent (its widest axis, unaffected by the model's -90°-about-X
// rotation) across the 6 cloud shapes — the scale that makes `spread` px
// actually mean "roughly this many pixels wide" on screen. Individual shapes
// vary ~24-41 units, which reads as natural size variety between windows.
const MODEL_BASE_WIDTH = 32;

// One window's cloud: one of the six cartoon cloud shapes, tinted per-window
// and sized from `spread`. The cloud's group position eases toward wherever
// the registry currently says that window's rect center is, so it glides
// rather than snaps when a window is dragged or resized; a slow sine bob is
// layered on top for a bit of life.
function DesktopCloud({
  targetCenter,
  variant,
  zOffset,
  spread,
  color,
  bobAmount,
  bobSpeed,
}) {
  const groupRef = useRef(null);
  // The eased "core" position, tracked separately from the group's actual
  // (core + bob) position — easing toward the bobbed position instead would
  // make it chase a constantly-moving target rather than settle.
  const coreRef = useRef(null);
  const scale = spread / MODEL_BASE_WIDTH;

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || !targetCenter) return;

    if (!coreRef.current) {
      coreRef.current = { x: targetCenter.x, y: targetCenter.y };
    } else {
      coreRef.current.x += (targetCenter.x - coreRef.current.x) * EASING;
      coreRef.current.y += (targetCenter.y - coreRef.current.y) * EASING;
    }

    const bob = Math.sin(clock.elapsedTime * bobSpeed) * bobAmount;
    group.position.set(coreRef.current.x, coreRef.current.y + bob, zOffset);
  });

  return (
    <group ref={groupRef}>
      <SingleCartoonCloud variant={variant} color={color} scale={scale} />
    </group>
  );
}

export default memo(DesktopCloud);
