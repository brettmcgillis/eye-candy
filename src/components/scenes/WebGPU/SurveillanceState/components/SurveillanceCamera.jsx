import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import SecurityCamera from '@elements/SecurityCamera/SecurityCamera';

import { ADAPTER, POST_BASE, POST_HALF, SCREEN } from '../utils/rig';

const SCREEN_CENTRE = new THREE.Vector3(...SCREEN.center);
const toRadians = THREE.MathUtils.degToRad;

function Stand({ post, geometry, material }) {
  const { adapter } = post;
  const band = POST_HALF * 2 + 0.012;
  const clampYs = [-0.3, 0.3].map((f) => adapter.centerY + adapter.height * f);
  return (
    <group position={post.position} rotation={[0, post.yaw, 0]}>
      <mesh
        castShadow
        geometry={geometry}
        material={material}
        position={[0, post.height / 2, 0]}
        receiveShadow
        scale={[POST_HALF * 2, post.height, POST_HALF * 2]}
      />
      <mesh
        castShadow
        geometry={geometry}
        material={material}
        position={[0, POST_BASE.height / 2, 0]}
        receiveShadow
        scale={[POST_BASE.half * 2, POST_BASE.height, POST_BASE.half * 2]}
      />
      <mesh
        castShadow
        geometry={geometry}
        material={material}
        position={[0, adapter.centerY, POST_HALF + ADAPTER.thickness / 2]}
        receiveShadow
        scale={[adapter.width, adapter.height, ADAPTER.thickness]}
      />
      {clampYs.map((y) => (
        <mesh
          castShadow
          geometry={geometry}
          key={y}
          material={material}
          position={[0, y, 0.002]}
          scale={[band, 0.018, band]}
        />
      ))}
    </group>
  );
}

const MemoStand = memo(Stand);

function SurveillanceCamera({ camera, feed, sway, geometry, material }) {
  const ref = useRef(null);
  const base = useRef({ pan: 0, tilt: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const { group, rig } = ref.current;
    group.updateWorldMatrix(true, false);
    target.copy(SCREEN_CENTRE);
    group.worldToLocal(target);
    rig.aimAt(target);
    base.current = { pan: rig.pan, tilt: rig.tilt };
    feed.lenses.set(camera.id, { eye: rig.lens, aim: rig.aim });
    return () => feed.lenses.delete(camera.id);
  }, [camera, feed, target]);

  useFrame(({ clock }) => {
    if (!sway || !ref.current) return;
    const t = clock.elapsedTime * camera.sway.rate * Math.PI * 2;
    const wobble = Math.sin(t + camera.sway.phase);
    ref.current.rig.pose(
      base.current.pan + toRadians(sway) * wobble,
      base.current.tilt + toRadians(sway) * 0.25 * Math.sin(t * 0.7)
    );
  });

  return (
    <>
      <SecurityCamera
        position={camera.position}
        ref={ref}
        rotation={[0, camera.yaw, 0]}
        scale={camera.scale}
      />
      <MemoStand geometry={geometry} material={material} post={camera.post} />
    </>
  );
}

export default memo(SurveillanceCamera);
