import React, { memo, useEffect, useMemo, useRef } from 'react';

import {
  createGroundMaterial,
  createGroundUniforms,
} from '../utils/groundMaterial';

const CLICK_SLOP_PX = 5;

function Ground({ config, food, onPick, worldSize }) {
  const uniforms = useMemo(createGroundUniforms, []);
  const material = useMemo(
    () => createGroundMaterial(food, uniforms),
    [food, uniforms]
  );
  const downRef = useRef(null);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.backgroundColor.value.set(config.backgroundColor);
    uniforms.soilColor.value.set(config.soilColor);
    uniforms.mossColor.value.set(config.mossColor);
    uniforms.meatColor.value.set(config.meatColor);
    uniforms.grid.value = config.gridStrength;
    uniforms.lab.value = config.view === 'lab' ? 1 : 0;
    uniforms.worldSize.value = worldSize;
  }, [config, uniforms, worldSize]);

  const onPointerDown = (event) => {
    downRef.current = [event.clientX, event.clientY];
  };

  const onPointerUp = (event) => {
    const down = downRef.current;

    if (
      down &&
      Math.hypot(event.clientX - down[0], event.clientY - down[1]) <
        CLICK_SLOP_PX
    ) {
      onPick(event.point);
    }

    downRef.current = null;
  };

  return (
    <mesh
      material={material}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      receiveShadow
      rotation-x={-Math.PI / 2}
    >
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
}

export default memo(Ground);
