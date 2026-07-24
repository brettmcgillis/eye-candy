/* eslint-disable consistent-return */
import React, { useLayoutEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

export default function DownwardSpotLight({
  angle,
  color,
  decay,
  distance,
  intensity,
  penumbra,
  position,
}) {
  const ref = useRef();
  const { scene } = useThree();

  useLayoutEffect(() => {
    if (!ref.current || !position) return;
    const { target } = ref.current;
    scene.add(target);
    target.position.set(position[0], position[1] - 100000, position[2]);
    target.updateMatrixWorld();
    return () => scene.remove(target);
  }, [position, scene]);

  if (!position) return null;
  return (
    <spotLight
      ref={ref}
      angle={angle}
      color={color}
      decay={decay}
      distance={distance}
      intensity={intensity}
      penumbra={penumbra}
      position={position}
    />
  );
}
