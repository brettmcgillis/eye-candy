import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import applySmokeConfig from '@elements/SimFire/applySmokeConfig';
import { MAX_PATHS, PATH_SAMPLES, createCurlSmoke } from '@modules/curlSmoke';
import splinePath from '@utils/splinePath';

const eye = new THREE.Vector3();

// The curl smoke from the stack along the runtime smoke splines, which
// follow the boat every frame. Each path keeps its authored start as its
// origin: particles are stored relative to it, so a bobbing stack bends the
// thread rather than dragging the whole plume. Lit warm at the stack mouth
// and pushed about by the cursor attractor. WebGPU only.
function StackSmoke({
  attractorsRef,
  attractorEnabled,
  configs,
  runtimeSplines,
  smoke,
  smokeAnchorRef,
  splines,
}) {
  const gl = useThree((state) => state.gl);
  const instance = useMemo(
    () => createCurlSmoke({ count: smoke.count }),
    [smoke.count]
  );
  useEffect(() => () => instance.dispose(), [instance]);

  applySmokeConfig(instance, smoke);

  const shown = useMemo(
    () =>
      runtimeSplines
        .map((points, index) => ({
          config: configs[index],
          origin: splines[index]?.[0]?.position.toArray(),
          points,
        }))
        .filter(
          ({ config, origin, points }) =>
            origin && points.length > 1 && config?.visible !== false
        )
        .slice(0, MAX_PATHS),
    [configs, runtimeSplines, splines]
  );

  useFrame((state, delta) => {
    if (!shown.length) return;
    instance.setPaths(
      shown.map(({ config, origin, points }) => ({
        origin,
        points: splinePath(
          points.map((point) => point.position),
          {
            closed: config?.closed,
            origin,
            samples: PATH_SAMPLES,
            tension: config?.tension ?? 0.5,
          }
        ),
      }))
    );

    const u = instance.uniforms;
    smokeAnchorRef.current?.getWorldPosition(u.flameTop.value);
    const attractor = attractorsRef.current?.[0];
    u.attraction.value =
      attractorEnabled && attractor
        ? attractor.strength * (attractor.type === 'repeller' ? -1 : 1)
        : 0;
    if (attractor) {
      u.attractor.value.fromArray(attractor.position);
      u.attractRadius.value = attractor.radius;
    }

    instance.advance(gl, Math.min(delta, 1 / 15));
    instance.sort(gl, state.camera.getWorldPosition(eye));
  });

  if (!shown.length) return null;
  return <primitive object={instance.mesh} />;
}

export default memo(StackSmoke);
