import { useControls } from 'leva';

import React from 'react';

import SparkSplatRenderer from './SparkRenderer';
import SparkSplat from './SparkSplat';

const DEFAULT_SPARK_CONFIG = {
  maxStdDev: 1.5,
  focalDistance: 4.0,
  near: 1,
  far: 15,
  mid: 5,
};

export default function SparkMultiSplat({
  splats,
  splatClickHandlers,
  splatDataTexture,
}) {
  const sparkControls = useControls(
    'Spark',
    {
      maxStdDev: { value: DEFAULT_SPARK_CONFIG.maxStdDev, min: 0, max: 2 },
      focalDistance: {
        value: DEFAULT_SPARK_CONFIG.focalDistance,
        min: 0,
        max: 10,
      },
      near: { value: DEFAULT_SPARK_CONFIG.near, min: 0, max: 5 },
      far: { value: DEFAULT_SPARK_CONFIG.far, min: 10, max: 20 },
      mid: { value: DEFAULT_SPARK_CONFIG.mid, min: 5, max: 10 },
    },
    { collapsed: true }
  );

  return (
    <SparkSplatRenderer {...sparkControls} splatDataTexture={splatDataTexture}>
      {splats.map((splat, i) => (
        <SparkSplat
          key={splat.id}
          splat={splat.src}
          position={splat.positionArray}
          rotation={splat.rotation}
          onClick={splatClickHandlers[i]}
        />
      ))}
    </SparkSplatRenderer>
  );
}
