import React, { useMemo } from 'react';

import { modelFile } from '@utils/appUtils';
import { SparkSplatMesh } from '@utils/spark-extend';

export default function SparkSplat({ splat, ...props }) {
  const splatMeshArgs = useMemo(() => ({ url: modelFile(splat) }), [splat]);
  return (
    <group {...props}>
      <SparkSplatMesh args={[splatMeshArgs]} rotation={[0, Math.PI, Math.PI]} />
    </group>
  );
}
