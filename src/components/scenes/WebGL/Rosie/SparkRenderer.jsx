import React, { useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { SparkRenderer } from '@utils/spark-extend';

export default function SparkSplatRenderer({
  splatDataTexture,
  maxStdDev,
  focalDistance,
  near,
  far,
  mid,
  children,
}) {
  const sparkRef = useRef();
  const renderer = useThree((state) => state.gl);

  // 🔒 args must be stable
  const sparkRendererArgs = useMemo(() => ({ renderer }), [renderer]);

  // 🔁 Update Spark renderer properties
  useEffect(() => {
    if (!sparkRef.current) return;
    sparkRef.current.maxStdDev = maxStdDev;
    sparkRef.current.focalDistance = focalDistance;
  }, [maxStdDev, focalDistance]);

  // 🎨 Update splat texture params
  useEffect(() => {
    if (!sparkRef.current || !splatDataTexture) return;

    sparkRef.current.splatTexture = {
      enable: true,
      texture: splatDataTexture,
      near,
      far,
      mid,
    };
  }, [splatDataTexture, near, far, mid]);

  return (
    <SparkRenderer ref={sparkRef} args={[sparkRendererArgs]}>
      {children}
    </SparkRenderer>
  );
}
