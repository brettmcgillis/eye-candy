import React, { memo, useCallback, useEffect, useMemo } from 'react';

import {
  Grass as GrassField,
  createGrassUniforms,
  scatterDisk,
  setGrassUniforms,
} from '@elements/Grass';

function Grass({
  avoid,
  count,
  height,
  pressers,
  pressReach,
  radius,
  rootColor,
  tipColor,
  width,
  windSpeed,
  windStrength,
}) {
  const uniforms = useMemo(() => createGrassUniforms({ windScale: 0.35 }), []);

  useEffect(() => {
    setGrassUniforms(uniforms, {
      bladeHeight: height,
      bladeWidth: width,
      pressReach,
      rootColor,
      tipColor,
      windSpeed,
      windStrength,
    });
  }, [
    height,
    pressReach,
    rootColor,
    tipColor,
    uniforms,
    width,
    windSpeed,
    windStrength,
  ]);

  const material = useMemo(() => ({ blade: 'straight', pressers }), [pressers]);

  const scatter = useCallback(
    (store) =>
      scatterDisk(store, { avoid, count, radius, scaleBase: 0.55, seed: 11 }),
    [avoid, count, radius]
  );

  return (
    <GrassField
      material={material}
      maxCount={count}
      receiveShadow
      scatter={scatter}
      uniforms={uniforms}
    />
  );
}

export default memo(Grass);
