import React, { memo, useEffect, useMemo, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import WaterSolver from '../runtime/WaterSolver';
import { buildWaterGeometry } from '../runtime/shoreSurface';
import createWaterMaterial from '../runtime/waterMaterial';

function Ocean({ bed, config }) {
  const { gl } = useThree();
  const [runtime, setRuntime] = useState(null);
  const geometry = useMemo(() => buildWaterGeometry(), []);

  useEffect(() => {
    const solver = new WaterSolver(bed.heights);
    const water = createWaterMaterial({
      bedTexture: bed.texture,
      foamTexture: solver.foamTexture,
      heightTexture: solver.heightTexture,
    });
    setRuntime({ solver, water });

    return () => {
      solver.dispose();
      water.material.dispose();
      setRuntime(null);
    };
  }, [bed]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!runtime) return;
    runtime.solver.update(config);
    runtime.water.update(config);
    if (config.runSimulation) runtime.solver.step(gl, delta, config);
  });

  if (!runtime) return null;

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={runtime.water.material}
      renderOrder={1}
    />
  );
}

export default memo(Ocean);
