import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, interactionGroups } from '@react-three/rapier';

import * as THREE from 'three';

import { PhysicalSingleRock, ROCK_VARIANT_COUNT } from '@elements/Rocks/Rocks';

import useRockStore from '../hooks/useRockStore';
import {
  GROUND_Y,
  MAX_GRASS_DISTURBERS,
  ROCK_CLEANUP_Y,
  ROCK_POOL_SIZE,
} from '../utils/sceneLayout';

// Rocks collide with structure (group 0: terrain, walls, frame — all left at
// Rapier's default group) and each other, but not with glass fragments (group
// 1) — a light shard resting against a rock was dragging its speed down.
const ROCK_GROUPS = interactionGroups(2, [0, 2]);

const SPAWN_OFFSET = 1.2;
const TARGET_DISTANCE = 40;
const TAP_THRESHOLD = 8;
const MIN_STEP = 1e-4;
const SWEEP_PAD = 0.2;
const SETTLE_SPEED = 0.6;
const SETTLE_HEIGHT = 2.5;
const PARK_Y = -80;

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const forward = new THREE.Vector3();
const spawn = new THREE.Vector3();
const target = new THREE.Vector3();
const dir = new THREE.Vector3();
const worldPos = new THREE.Vector3();
const segment = new THREE.Vector3();

function parkedPosition(index) {
  return [(index - ROCK_POOL_SIZE / 2) * 0.5, PARK_Y, 0];
}

function park(body, index) {
  if (!body) {
    return;
  }
  const [x, y, z] = parkedPosition(index);
  body.setTranslation({ x, y, z }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.sleep?.();
}

const PooledRock = memo(function PooledRock({
  bodyRefs,
  meshRefs,
  index,
  scale,
}) {
  const variant = index % ROCK_VARIANT_COUNT;
  return (
    <RigidBody
      ref={(body) => {
        bodyRefs.current[index] = body;
        if (body && !body.userData?.init) {
          park(body, index);
          body.userData = { ...body.userData, init: true };
        }
      }}
      colliders="hull"
      collisionGroups={ROCK_GROUPS}
      solverGroups={ROCK_GROUPS}
      ccd
      canSleep
      mass={0.3}
      friction={0.35}
      restitution={0.32}
      linearDamping={0.05}
      angularDamping={0.35}
      position={parkedPosition(index)}
    >
      <group
        ref={(node) => {
          meshRefs.current[index] = node;
        }}
      >
        <PhysicalSingleRock scale={scale} variant={variant} />
      </group>
    </RigidBody>
  );
});

function RockProjectiles({
  rocks,
  runtime,
  paneMeshesRef,
  wallMeshesRef,
  disturbersRef,
  playImpact,
}) {
  const { camera, gl } = useThree();
  const bodyRefs = useRef([]);
  const meshRefs = useRef([]);
  const stateRef = useRef(
    Array.from({ length: ROCK_POOL_SIZE }, () => ({
      active: false,
      wallHit: false,
      settled: false,
      prev: new THREE.Vector3(),
    }))
  );
  const nextSlotRef = useRef(0);
  const hasRocksRef = useRef(false);
  const rocksRef = useRef(rocks);
  rocksRef.current = rocks;

  const setHasRocks = useRockStore((s) => s.setHasRocks);
  const registerFire = useRockStore((s) => s.registerFire);
  const unregisterFire = useRockStore((s) => s.unregisterFire);
  const registerClear = useRockStore((s) => s.registerClear);
  const unregisterClear = useRockStore((s) => s.unregisterClear);

  const slots = useMemo(
    () => Array.from({ length: ROCK_POOL_SIZE }, (_, index) => index),
    []
  );

  const launch = useMemo(
    () => (targetWorldPoint) => {
      const index = nextSlotRef.current;
      const body = bodyRefs.current[index];
      const state = stateRef.current[index];
      nextSlotRef.current = (index + 1) % ROCK_POOL_SIZE;
      if (!body) {
        return;
      }

      camera.getWorldDirection(forward);
      spawn.copy(camera.position).addScaledVector(forward, SPAWN_OFFSET);
      dir.copy(targetWorldPoint).sub(spawn);
      if (dir.lengthSq() < MIN_STEP) {
        return;
      }
      dir.normalize().multiplyScalar(rocksRef.current.speed);

      body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true);
      body.setLinvel({ x: dir.x, y: dir.y, z: dir.z }, true);
      body.setAngvel(
        {
          x: THREE.MathUtils.randFloatSpread(rocksRef.current.spin),
          y: THREE.MathUtils.randFloatSpread(rocksRef.current.spin),
          z: THREE.MathUtils.randFloatSpread(rocksRef.current.spin),
        },
        true
      );
      body.wakeUp?.();

      state.active = true;
      state.wallHit = false;
      state.settled = false;
      state.prev.copy(spawn);
      if (!hasRocksRef.current) {
        hasRocksRef.current = true;
        setHasRocks(true);
      }
    },
    [camera, setHasRocks]
  );

  const fireCenter = useMemo(
    () => () => {
      camera.getWorldDirection(forward);
      target.copy(camera.position).addScaledVector(forward, TARGET_DISTANCE);
      launch(target.clone());
    },
    [camera, launch]
  );

  useEffect(() => {
    registerFire(fireCenter);
    return unregisterFire;
  }, [fireCenter, registerFire, unregisterFire]);

  useEffect(() => {
    const clear = () => {
      bodyRefs.current.forEach((body, index) => park(body, index));
      stateRef.current.forEach((state) => {
        const next = state;
        next.active = false;
        next.settled = false;
      });
      disturbersRef.current = [];
      nextSlotRef.current = 0;
    };
    registerClear(clear);
    return unregisterClear;
  }, [disturbersRef, registerClear, unregisterClear]);

  useEffect(() => {
    const { domElement } = gl;
    let down = null;

    const onPointerDown = (event) => {
      if (event.button === 0) {
        down = { x: event.clientX, y: event.clientY };
      }
    };
    const onPointerUp = (event) => {
      const start = down;
      down = null;
      if (!start || event.button !== 0) {
        return;
      }
      if (
        Math.hypot(event.clientX - start.x, event.clientY - start.y) >
        TAP_THRESHOLD
      ) {
        return;
      }
      const rect = domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      launch(raycaster.ray.at(TARGET_DISTANCE, target.clone()));
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [camera, gl, launch]);

  useFrame(() => {
    const paneMeshes = Object.values(paneMeshesRef.current ?? {});
    const wallMeshes = wallMeshesRef.current ?? [];
    const collisionObjects = paneMeshes.concat(wallMeshes);
    const disturbers = [];
    let anyActive = false;

    stateRef.current.forEach((state, index) => {
      const body = bodyRefs.current[index];
      const mesh = meshRefs.current[index];
      if (!body || !mesh || !state.active) {
        return;
      }
      anyActive = true;
      mesh.getWorldPosition(worldPos);

      segment.copy(worldPos).sub(state.prev);
      const distance = segment.length();
      if (distance > MIN_STEP && collisionObjects.length) {
        raycaster.set(state.prev, segment.normalize());
        raycaster.far = distance + SWEEP_PAD;
        const hit = raycaster.intersectObjects(collisionObjects, false)[0];
        if (hit) {
          const linvel = body.linvel();
          const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
          const surfaceType = hit.object?.userData?.surfaceType;
          const paneKey = hit.object?.userData?.paneKey;
          if (surfaceType === 'window-pane' && paneKey) {
            if (!runtime.isPaneBroken(paneKey)) {
              runtime.breakPane(paneKey, hit.point.clone());
              playImpact('glass', speed);
            }
          } else if (surfaceType === 'wall' && !state.wallHit) {
            state.wallHit = true;
            playImpact('concrete', speed);
          }
        }
      }
      state.prev.copy(worldPos);

      const linvel = body.linvel();
      const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
      if (
        !state.settled &&
        speed < SETTLE_SPEED &&
        worldPos.y < GROUND_Y + SETTLE_HEIGHT
      ) {
        state.settled = true;
        playImpact('thump', 6);
      }
      if (state.settled && disturbers.length < MAX_GRASS_DISTURBERS) {
        disturbers.push({ x: worldPos.x, z: worldPos.z });
      }

      if (body.translation().y < ROCK_CLEANUP_Y) {
        park(body, index);
        state.active = false;
        state.settled = false;
      }
    });

    disturbersRef.current = disturbers;
    if (!anyActive && hasRocksRef.current) {
      hasRocksRef.current = false;
      setHasRocks(false);
    }
  });

  return (
    <group>
      {slots.map((index) => (
        <PooledRock
          key={index}
          bodyRefs={bodyRefs}
          meshRefs={meshRefs}
          index={index}
          scale={rocks.scale}
        />
      ))}
    </group>
  );
}

export default memo(RockProjectiles);
