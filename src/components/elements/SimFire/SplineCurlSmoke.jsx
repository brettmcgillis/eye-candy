import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { MAX_PATHS, PATH_SAMPLES, createCurlSmoke } from '@modules/curlSmoke';

import applySmokeConfig from './applySmokeConfig';
import { splineWorldPath } from './simFireLayout';

const eye = new THREE.Vector3();

// The Burning At Both Ends curl smoke along authored Smoke splines: a
// laminar thread from each spline's start that breaks into curl eddies and
// carries on past its end, sorted for the camera and lit warm near up to
// two `glowAt` points. WebGPU only.
function SplineCurlSmoke({ glowAt = [], smoke, splines }) {
  const gl = useThree((state) => state.gl);
  const instance = useMemo(
    () => createCurlSmoke({ count: smoke.count }),
    [smoke.count]
  );
  useEffect(() => () => instance.dispose(), [instance]);

  const paths = useMemo(
    () =>
      splines.slice(0, MAX_PATHS).map((spline) => {
        const path = splineWorldPath(spline, PATH_SAMPLES);
        const [ox, oy, oz] = path[0];
        return {
          origin: path[0],
          points: path.map(([x, y, z]) => [x - ox, y - oy, z - oz]),
        };
      }),
    [splines]
  );
  useEffect(() => {
    if (paths.length) instance.setPaths(paths);
  }, [instance, paths]);

  applySmokeConfig(instance, smoke, glowAt);

  useFrame((state, delta) => {
    instance.advance(gl, Math.min(delta, 1 / 15));
    instance.sort(gl, state.camera.getWorldPosition(eye));
  }, -1);

  if (!paths.length) return null;
  return <primitive object={instance.mesh} />;
}

export default memo(SplineCurlSmoke);
