import React, { memo, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { setSurfaceFrame } from '@modules/houseOfLeaves';

import useKitMaterials from '../hooks/useKitMaterials';
import { buildRoute } from '../utils/route';
import WorldContent from './WorldContent';

// One continuous world, walked at a constant speed. Where the route needs to be
// endless it folds: the camera holds still and the world moves under it at the
// same speed instead. Only relative motion is visible, so handing the velocity
// between the two is invisible, and the fold's transform is reduced modulo a
// period the geometry is congruent under, so its wrap is the identity. There is
// no cut anywhere in the tour and nothing has to line up by hand.
function ContinuousTour({ config }) {
  const camera = useThree((state) => state.camera);
  const route = useMemo(() => buildRoute(config), [config]);
  const materials = useKitMaterials(config);
  const worldRef = useRef(null);
  const travel = useRef(0);
  const lastYaw = useRef(null);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 20);
    travel.current += config.travelSpeed * step;
    if (travel.current > route.length) travel.current -= route.length;

    const here = route.sample(travel.current);
    camera.position.set(...here.position);

    // Facing is applied as a delta rather than written outright, so the route
    // can turn the camera down the helix without taking away free look.
    if (lastYaw.current === null) {
      camera.rotation.set(0, here.yaw, 0, 'YXZ');
    } else {
      camera.rotation.y += here.yaw - lastYaw.current;
    }
    lastYaw.current = here.yaw;

    const world = worldRef.current;
    if (world) {
      world.position.set(here.world.x, here.world.y, here.world.z);
      world.rotation.y = here.world.spin;
    }
    // The textures are projected from world space, so they have to be told
    // about the fold or the geometry slides through a stationary texture.
    setSurfaceFrame(materials.stone, here.world);
    setSurfaceFrame(materials.shell, here.world);
    setSurfaceFrame(materials.wall, here.world);
  });

  return (
    <group>
      <group ref={worldRef}>
        <WorldContent config={config} materials={materials} route={route} />
      </group>
      {config.showBounds && (
        <>
          <mesh position={[route.anchorX, route.eye, 0]}>
            <sphereGeometry args={[1.1, 16, 12]} />
            <meshBasicMaterial color="#ffd23a" opacity={0.6} transparent />
          </mesh>
          <mesh
            position={[
              Math.cos(route.stairAngle) * route.pathRadius,
              -route.anchorDrop + route.eye,
              Math.sin(route.stairAngle) * route.pathRadius,
            ]}
          >
            <sphereGeometry args={[1.1, 16, 12]} />
            <meshBasicMaterial color="#ffd23a" opacity={0.6} transparent />
          </mesh>
        </>
      )}
    </group>
  );
}

export default memo(ContinuousTour);
