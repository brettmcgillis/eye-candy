import { memo, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import { fieldParams, toFractal } from '../utils/frame';
import { treeDistance } from '../utils/treeDistance';

// Trails the sphere on a spring so the plume streams toward the viewer and the
// caverns rush past.
function ChaseCamera({ config, worldRef }) {
  const configRef = useRef(config);
  configRef.current = config;

  const camera = useThree((state) => state.camera);
  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      look: new THREE.Vector3(),
      probe: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }),
    []
  );
  const lookRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const c = configRef.current;
    const world = worldRef.current;
    const { desired, look, probe, target } = scratch;

    desired
      .copy(world.position)
      .addScaledVector(world.heading, -c.followDistance * c.worldScale)
      .addScaledVector(
        THREE.Object3D.DEFAULT_UP,
        c.followHeight * c.worldScale
      );

    // Sitting the camera inside a branch fills the frame with a wall; when the
    // spring would park it in geometry, reel it in toward the sphere instead.
    toFractal(
      desired,
      target.set(c.pivotX, c.pivotY, c.pivotZ),
      c.worldScale,
      probe
    );
    const clearance = treeDistance(probe.x, probe.y, probe.z, fieldParams(c));
    if (Number.isFinite(clearance) && clearance < c.cameraClearance) {
      const pull = 1 - clearance / c.cameraClearance;
      desired.lerp(world.position, THREE.MathUtils.clamp(pull, 0, 0.9));
    }

    const ease = 1 - Math.exp(-c.followStiffness * Math.min(delta, 1 / 30));
    camera.position.lerp(desired, ease);

    look
      .copy(world.position)
      .addScaledVector(world.heading, c.lookAhead * c.worldScale);
    lookRef.current.lerp(look, ease);
    camera.lookAt(lookRef.current);

    if (camera.fov !== c.followFov) {
      camera.fov = c.followFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

export default memo(ChaseCamera);
