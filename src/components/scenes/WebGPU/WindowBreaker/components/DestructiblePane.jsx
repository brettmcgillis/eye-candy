import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DestructibleMesh, FractureOptions } from '@dgreenheck/three-pinata';
import { useFrame } from '@react-three/fiber';
import {
  CuboidCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';

import * as THREE from 'three';

const FRAGMENT_COUNT = 14;
const FRAGMENT_MASS = 0.02;
const BURST_SPEED = 0.85;
// Outward (in-plane) kick is damped so shards mostly drop and catch on the sill
// instead of spraying clear of the frame.
const LATERAL_KICK = 0.45;
const SPIN = 6;
const MIN_HALF = 0.004;
// Fragments collide with structure (group 0: frame, walls, ground) but not with
// each other — same trick the fish tank uses to keep shards from jamming.
const FRAGMENT_GROUPS = interactionGroups(1, [0]);

const worldPoint = new THREE.Vector3();
const localImpact = new THREE.Vector3();
const fragWorldPos = new THREE.Vector3();
const fragLocalPos = new THREE.Vector3();
const burstDir = new THREE.Vector3();
const groupQuat = new THREE.Quaternion();
const fragQuat = new THREE.Quaternion();
const localQuat = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const boundsSize = new THREE.Vector3();
const boundsCenter = new THREE.Vector3();

function buildFragmentBody(fragmentMesh, group, impactWorld) {
  const mesh = fragmentMesh;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.updateWorldMatrix(true, false);
  mesh.getWorldPosition(fragWorldPos);

  burstDir.copy(fragWorldPos).sub(impactWorld);
  if (burstDir.lengthSq() < 1e-6) {
    burstDir.set(THREE.MathUtils.randFloatSpread(0.4), 0.4, 1);
  }
  burstDir.normalize();

  group.worldToLocal(fragLocalPos.copy(fragWorldPos));
  group.getWorldQuaternion(groupQuat);
  mesh.getWorldQuaternion(fragQuat);
  localQuat.copy(groupQuat).invert().multiply(fragQuat);
  localEuler.setFromQuaternion(localQuat);

  const { geometry } = mesh;
  geometry.computeBoundingBox();
  geometry.boundingBox.getSize(boundsSize);
  geometry.boundingBox.getCenter(boundsCenter);

  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  mesh.updateMatrix();

  return {
    key: mesh.uuid,
    mesh,
    position: fragLocalPos.toArray(),
    rotation: [localEuler.x, localEuler.y, localEuler.z],
    colliderArgs: [
      Math.max(boundsSize.x * 0.5, MIN_HALF),
      Math.max(boundsSize.y * 0.5, MIN_HALF),
      Math.max(boundsSize.z * 0.5, MIN_HALF),
    ],
    colliderPosition: [boundsCenter.x, boundsCenter.y, boundsCenter.z],
    linvel: {
      x:
        burstDir.x *
        BURST_SPEED *
        LATERAL_KICK *
        THREE.MathUtils.randFloat(0.7, 1.4),
      y: burstDir.y * BURST_SPEED + THREE.MathUtils.randFloat(0.05, 0.25),
      z:
        burstDir.z *
        BURST_SPEED *
        LATERAL_KICK *
        THREE.MathUtils.randFloat(0.7, 1.4),
    },
    angvel: {
      x: THREE.MathUtils.randFloatSpread(SPIN),
      y: THREE.MathUtils.randFloatSpread(SPIN),
      z: THREE.MathUtils.randFloatSpread(SPIN),
    },
  };
}

const PaneFragment = memo(function PaneFragment({ fragment }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return undefined;
    }
    body.setLinvel(fragment.linvel, true);
    body.setAngvel(fragment.angvel, true);
    body.wakeUp?.();
    return () => fragment.mesh.geometry?.dispose?.();
  }, [fragment]);

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={fragment.position}
      rotation={fragment.rotation}
      mass={FRAGMENT_MASS}
      friction={0.9}
      restitution={0.12}
      linearDamping={0.6}
      angularDamping={1.2}
      canSleep
      ccd
    >
      <CuboidCollider
        args={fragment.colliderArgs}
        position={fragment.colliderPosition}
        collisionGroups={FRAGMENT_GROUPS}
        solverGroups={FRAGMENT_GROUPS}
      />
      <primitive object={fragment.mesh} />
    </RigidBody>
  );
});

function DestructiblePane({
  paneKey,
  width,
  height,
  glass,
  runtime,
  registerPane,
}) {
  const groupRef = useRef(null);
  const lastBreakIdRef = useRef(0);
  const [fragments, setFragments] = useState([]);

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: glass.color,
        transparent: true,
        opacity: glass.opacity,
        roughness: 0.05,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    [glass.color, glass.opacity]
  );
  const innerMaterial = useMemo(() => {
    const m = outerMaterial.clone();
    m.opacity = Math.min(glass.opacity + 0.2, 0.6);
    m.roughness = 0.2;
    return m;
  }, [outerMaterial, glass.opacity]);

  const destructibleMesh = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new DestructibleMesh(geometry, outerMaterial, innerMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, [width, height, outerMaterial, innerMaterial]);

  useEffect(() => {
    destructibleMesh.userData = {
      ...destructibleMesh.userData,
      surfaceType: 'window-pane',
      paneKey,
    };
    registerPane(paneKey, destructibleMesh);
    return () => {
      registerPane(paneKey, null);
      destructibleMesh.geometry?.dispose?.();
      outerMaterial.dispose();
      innerMaterial.dispose();
    };
  }, [destructibleMesh, innerMaterial, outerMaterial, paneKey, registerPane]);

  const fracture = useCallback(
    (impactWorld) => {
      const group = groupRef.current;
      if (!group) {
        return [];
      }
      destructibleMesh.updateWorldMatrix(true, false);
      const impactLocal = destructibleMesh.worldToLocal(
        localImpact.copy(impactWorld)
      );
      const frags = destructibleMesh.fracture(
        new FractureOptions({
          fractureMethod: 'voronoi',
          fragmentCount: FRAGMENT_COUNT,
          seed: (lastBreakIdRef.current + 1) * 131 + paneKey.length,
          voronoiOptions: {
            impactPoint: impactLocal.clone(),
            impactRadius: Math.max(Math.min(width, height) * 0.2, 0.05),
            mode: '2.5D',
            projectionAxis: 'z',
          },
        })
      );
      return frags.map((fm) => buildFragmentBody(fm, group, impactWorld));
    },
    [destructibleMesh, height, paneKey, width]
  );

  useFrame(() => {
    const event = runtime.getPaneBreakEvent(paneKey);
    const broken = runtime.isPaneBroken(paneKey);

    if (!broken && (lastBreakIdRef.current || fragments.length)) {
      lastBreakIdRef.current = 0;
      setFragments([]);
    }

    if (broken && event && event.id > lastBreakIdRef.current) {
      lastBreakIdRef.current = event.id;
      setFragments(fracture(worldPoint.fromArray(event.worldPoint)));
    }

    destructibleMesh.visible = !broken;
  });

  return (
    <group ref={groupRef}>
      <primitive object={destructibleMesh} />
      {fragments.map((fragment) => (
        <PaneFragment key={fragment.key} fragment={fragment} />
      ))}
    </group>
  );
}

export default memo(DestructiblePane);
