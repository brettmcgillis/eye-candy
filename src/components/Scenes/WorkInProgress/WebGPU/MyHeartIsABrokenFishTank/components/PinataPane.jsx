import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DestructibleMesh, FractureOptions } from '@dgreenheck/three-pinata';
import { useFrame } from '@react-three/fiber';
import {
  CuboidCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';

const FRAGMENT_BURST_SPEED = 1.35;
const FRAGMENT_COUNT = 18;
const FRAGMENT_COUNTS_BY_GENERATION = [0, FRAGMENT_COUNT, 8, 4];
const FRAGMENT_FRICTION = 0.95;
const FRAGMENT_LINEAR_DAMPING = 0.85;
const FRAGMENT_MASS = 0.025;
const FRAGMENT_RESTITUTION = 0.1;
const FRAGMENT_SPIN = 8;
const FRAGMENT_ANGULAR_DAMPING = 1.4;
const DEFAULT_COLLISION_GROUP = 0;
const GLASS_FRAGMENT_COLLISION_GROUP = 1;
const MIN_FRAGMENT_HALF_EXTENT = 0.002;
const MIN_IMPACT_RADIUS = 0.08;
const REST_THRESHOLD = 0.0006;

const sharedBoundsSize = new THREE.Vector3();
const sharedFragmentBoundsCenter = new THREE.Vector3();
const sharedFragmentBoundsSize = new THREE.Vector3();
const sharedFragmentDirection = new THREE.Vector3();
const sharedImpactWorldPoint = new THREE.Vector3();
const sharedAssetWorldQuaternion = new THREE.Quaternion();
const sharedLocalImpactPoint = new THREE.Vector3();
const sharedLocalPosition = new THREE.Vector3();
const sharedLocalQuaternion = new THREE.Quaternion();
const sharedRotation = new THREE.Euler();
const sharedSourceWorldPosition = new THREE.Vector3();
const sharedSourceWorldQuaternion = new THREE.Quaternion();
const sharedFragmentWorldPosition = new THREE.Vector3();
const IDENTITY_SCALE = Object.freeze([1, 1, 1]);
const ZERO_ROTATION = Object.freeze([0, 0, 0]);
const ZERO_POSITION = Object.freeze([0, 0, 0]);
const GLASS_FRAGMENT_COLLISION_MASK = interactionGroups(
  GLASS_FRAGMENT_COLLISION_GROUP,
  [DEFAULT_COLLISION_GROUP]
);

const PinataFragmentRigidBody = React.memo(function PinataFragmentRigidBody({
  fragment,
  fragmentObjectsRef,
  fragmentHandlesRef,
  onImpact,
  paneKey,
}) {
  const bodyRef = useRef(null);
  const fragmentObjectsStore = fragmentObjectsRef?.current ?? null;

  useEffect(
    () => () => {
      fragment.mesh.geometry?.dispose?.();
    },
    [fragment.mesh]
  );

  useEffect(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    body.setLinvel(fragment.linearVelocity, true);
    body.setAngvel(fragment.angularVelocity, true);
    body.wakeUp?.();
  }, [fragment.angularVelocity, fragment.linearVelocity]);

  useEffect(() => {
    const { mesh } = fragment;
    const fragmentHandles = fragmentHandlesRef.current;

    fragmentHandles[fragment.key] = {
      body: bodyRef.current,
      generation: fragment.generation,
      mesh,
    };

    mesh.userData = {
      ...mesh.userData,
      fragmentKey: fragment.key,
      paneKey,
      surfaceType: 'tank-pane-fragment',
      onProjectileImpact: onImpact,
    };

    if (fragmentObjectsStore) {
      fragmentObjectsStore[fragment.key] = mesh;
    }

    return () => {
      delete fragmentHandles[fragment.key];

      if (fragmentObjectsStore) {
        delete fragmentObjectsStore[fragment.key];
      }

      delete mesh.userData.fragmentKey;
      delete mesh.userData.onProjectileImpact;
      delete mesh.userData.paneKey;
      delete mesh.userData.surfaceType;
    };
  }, [
    fragment.generation,
    fragment.key,
    fragment.mesh,
    fragmentHandlesRef,
    fragmentObjectsStore,
    onImpact,
    paneKey,
  ]);

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={fragment.position}
      rotation={fragment.rotation}
      friction={FRAGMENT_FRICTION}
      restitution={FRAGMENT_RESTITUTION}
      mass={FRAGMENT_MASS}
      linearDamping={FRAGMENT_LINEAR_DAMPING}
      angularDamping={FRAGMENT_ANGULAR_DAMPING}
      canSleep
      ccd
    >
      <CuboidCollider
        args={fragment.colliderArgs}
        collisionGroups={GLASS_FRAGMENT_COLLISION_MASK}
        position={fragment.colliderPosition}
        solverGroups={GLASS_FRAGMENT_COLLISION_MASK}
      />
      <primitive
        object={fragment.mesh}
        position={ZERO_POSITION}
        rotation={ZERO_ROTATION}
        scale={fragment.scale ?? IDENTITY_SCALE}
      />
    </RigidBody>
  );
});

function getFragmentCountForGeneration(generation) {
  return FRAGMENT_COUNTS_BY_GENERATION[
    Math.min(generation, FRAGMENT_COUNTS_BY_GENERATION.length - 1)
  ];
}

function getLocalFragmentTransform(
  assetGroup,
  sourceMesh,
  fragmentWorldPosition
) {
  assetGroup.worldToLocal(sharedLocalPosition.copy(fragmentWorldPosition));
  assetGroup.getWorldQuaternion(sharedAssetWorldQuaternion);
  sourceMesh.getWorldQuaternion(sharedSourceWorldQuaternion);
  sharedLocalQuaternion
    .copy(sharedAssetWorldQuaternion)
    .invert()
    .multiply(sharedSourceWorldQuaternion);
  sharedRotation.setFromQuaternion(sharedLocalQuaternion);

  return {
    position: sharedLocalPosition.toArray(),
    rotation: [sharedRotation.x, sharedRotation.y, sharedRotation.z],
    scale: sourceMesh.scale.toArray(),
  };
}

function getFractureProfile(geometry) {
  geometry.computeBoundingBox();
  geometry.boundingBox?.getSize(sharedBoundsSize);

  const axes = [
    { axis: 'x', size: sharedBoundsSize.x },
    { axis: 'y', size: sharedBoundsSize.y },
    { axis: 'z', size: sharedBoundsSize.z },
  ].sort((left, right) => left.size - right.size);

  return {
    impactRadius: Math.max(
      Math.min(axes[1].size, axes[2].size) * 0.18,
      MIN_IMPACT_RADIUS
    ),
    projectionAxis: axes[0].axis,
  };
}

function getFragmentColliderShape(fragmentMesh, localScale) {
  const { geometry } = fragmentMesh;
  const scaleX = Math.abs(localScale?.[0] ?? 1);
  const scaleY = Math.abs(localScale?.[1] ?? 1);
  const scaleZ = Math.abs(localScale?.[2] ?? 1);

  geometry.computeBoundingBox();
  geometry.boundingBox?.getCenter(sharedFragmentBoundsCenter);
  geometry.boundingBox?.getSize(sharedFragmentBoundsSize);

  return {
    colliderArgs: [
      Math.max(
        sharedFragmentBoundsSize.x * scaleX * 0.5,
        MIN_FRAGMENT_HALF_EXTENT
      ),
      Math.max(
        sharedFragmentBoundsSize.y * scaleY * 0.5,
        MIN_FRAGMENT_HALF_EXTENT
      ),
      Math.max(
        sharedFragmentBoundsSize.z * scaleZ * 0.5,
        MIN_FRAGMENT_HALF_EXTENT
      ),
    ],
    colliderPosition: [
      sharedFragmentBoundsCenter.x * scaleX,
      sharedFragmentBoundsCenter.y * scaleY,
      sharedFragmentBoundsCenter.z * scaleZ,
    ],
  };
}

function normalizeFragmentMesh(fragmentMesh) {
  // three-pinata returns fragments with world-rooted transforms already
  // applied. Reset the nested mesh to identity before first render so the
  // Rapier body owns the transform exactly once.
  fragmentMesh.position.set(0, 0, 0);
  fragmentMesh.rotation.set(0, 0, 0);
  fragmentMesh.scale.set(1, 1, 1);
  fragmentMesh.updateMatrix();
  fragmentMesh.updateMatrixWorld(true);
}

function buildFragmentBody({
  assetGroup,
  fallbackWorldPoint,
  fragmentMesh,
  generation,
  impactWorldPoint,
  inheritedAngularVelocity,
  inheritedLinearVelocity,
  sourceMesh,
}) {
  const nextFragmentMesh = fragmentMesh;

  nextFragmentMesh.castShadow = true;
  nextFragmentMesh.receiveShadow = true;
  nextFragmentMesh.updateWorldMatrix(true, false);
  nextFragmentMesh.getWorldPosition(sharedFragmentWorldPosition);

  sharedFragmentDirection
    .copy(sharedFragmentWorldPosition)
    .sub(impactWorldPoint);

  if (sharedFragmentDirection.lengthSq() <= REST_THRESHOLD) {
    sharedFragmentDirection
      .copy(sharedFragmentWorldPosition)
      .sub(fallbackWorldPoint);
  }

  if (sharedFragmentDirection.lengthSq() <= REST_THRESHOLD) {
    sharedFragmentDirection.set(
      THREE.MathUtils.randFloatSpread(0.2),
      1,
      THREE.MathUtils.randFloatSpread(0.2)
    );
  }

  sharedFragmentDirection.normalize();

  const localTransform = getLocalFragmentTransform(
    assetGroup,
    sourceMesh,
    sharedFragmentWorldPosition
  );
  const colliderShape = getFragmentColliderShape(
    nextFragmentMesh,
    localTransform.scale
  );

  normalizeFragmentMesh(nextFragmentMesh);

  return {
    angularVelocity: {
      x:
        (inheritedAngularVelocity?.x ?? 0) +
        THREE.MathUtils.randFloatSpread(FRAGMENT_SPIN),
      y:
        (inheritedAngularVelocity?.y ?? 0) +
        THREE.MathUtils.randFloatSpread(FRAGMENT_SPIN),
      z:
        (inheritedAngularVelocity?.z ?? 0) +
        THREE.MathUtils.randFloatSpread(FRAGMENT_SPIN),
    },
    generation,
    key: nextFragmentMesh.uuid,
    linearVelocity: {
      x:
        (inheritedLinearVelocity?.x ?? 0) +
        sharedFragmentDirection.x *
          FRAGMENT_BURST_SPEED *
          THREE.MathUtils.randFloat(0.75, 1.35),
      y:
        (inheritedLinearVelocity?.y ?? 0) +
        sharedFragmentDirection.y *
          FRAGMENT_BURST_SPEED *
          THREE.MathUtils.randFloat(0.75, 1.35) +
        THREE.MathUtils.randFloat(0.25, 0.6),
      z:
        (inheritedLinearVelocity?.z ?? 0) +
        sharedFragmentDirection.z *
          FRAGMENT_BURST_SPEED *
          THREE.MathUtils.randFloat(0.75, 1.35),
    },
    mesh: nextFragmentMesh,
    colliderArgs: colliderShape.colliderArgs,
    colliderPosition: colliderShape.colliderPosition,
    position: localTransform.position,
    rotation: localTransform.rotation,
    scale: localTransform.scale,
  };
}

export default function PinataPane({
  assetGroupRef,
  fragmentObjectsRef,
  geometry,
  material,
  paneKey,
  paneProps,
  runtime,
  tank,
}) {
  const fragmentHandlesRef = useRef({});
  const lastBreakIdRef = useRef(0);
  const fragmentBodiesRef = useRef([]);
  const [fragmentBodies, setFragmentBodies] = useState([]);
  const outerMaterial = useMemo(() => material.clone(), [material]);
  const innerMaterial = useMemo(() => {
    const nextMaterial = material.clone();

    if (nextMaterial.color) {
      nextMaterial.color.offsetHSL(0, 0, 0.08);
    }

    if (typeof nextMaterial.opacity === 'number') {
      nextMaterial.opacity = Math.min(tank.glassOpacity + 0.22, 0.5);
      nextMaterial.transparent = true;
    }

    if (typeof nextMaterial.roughness === 'number') {
      nextMaterial.roughness = Math.min(nextMaterial.roughness + 0.16, 1);
    }

    if (typeof nextMaterial.metalness === 'number') {
      nextMaterial.metalness = 0.02;
    }

    nextMaterial.side = THREE.DoubleSide;

    return nextMaterial;
  }, [material, tank.glassOpacity]);
  const destructibleMesh = useMemo(() => {
    const nextMesh = new DestructibleMesh(
      geometry.clone(),
      outerMaterial,
      innerMaterial
    );

    nextMesh.castShadow = true;
    nextMesh.receiveShadow = true;

    return nextMesh;
  }, [geometry, innerMaterial, outerMaterial]);

  useEffect(() => {
    const refCallback = paneProps?.ref;

    refCallback?.(destructibleMesh);

    return () => {
      refCallback?.(null);
      destructibleMesh.geometry?.dispose?.();
      outerMaterial.dispose();
      innerMaterial.dispose();
    };
  }, [destructibleMesh, innerMaterial, outerMaterial, paneProps]);

  const fractureMesh = React.useCallback(
    ({
      inheritedAngularVelocity = null,
      inheritedLinearVelocity = null,
      sourceGeneration,
      sourceMesh,
      worldPoint,
    }) => {
      const assetGroup = assetGroupRef.current;

      if (!assetGroup) {
        return [];
      }

      const nextGeneration = sourceGeneration + 1;

      if (nextGeneration >= FRAGMENT_COUNTS_BY_GENERATION.length) {
        return [];
      }

      sourceMesh.updateWorldMatrix(true, false);
      sourceMesh.getWorldPosition(sharedSourceWorldPosition);

      const impactWorldPoint = Array.isArray(worldPoint)
        ? sharedImpactWorldPoint.fromArray(worldPoint)
        : sharedImpactWorldPoint.copy(worldPoint);
      const impactPoint = sourceMesh.worldToLocal(
        sharedLocalImpactPoint.copy(impactWorldPoint)
      );
      const sourceFractureProfile = getFractureProfile(sourceMesh.geometry);
      const fragments = sourceMesh.fracture(
        new FractureOptions({
          fractureMethod: 'voronoi',
          fragmentCount: getFragmentCountForGeneration(nextGeneration),
          seed:
            (lastBreakIdRef.current + nextGeneration) * 101 + paneKey.length,
          voronoiOptions: {
            impactPoint,
            impactRadius: sourceFractureProfile.impactRadius,
            mode: '2.5D',
            projectionAxis: sourceFractureProfile.projectionAxis,
          },
        })
      );

      return fragments.map((fragmentMesh) =>
        buildFragmentBody({
          assetGroup,
          fallbackWorldPoint: sharedSourceWorldPosition,
          fragmentMesh,
          generation: nextGeneration,
          impactWorldPoint,
          inheritedAngularVelocity,
          inheritedLinearVelocity,
          sourceMesh,
        })
      );
    },
    [assetGroupRef, paneKey]
  );

  const handleFragmentImpact = useMemo(
    () => (fragmentKey, worldPoint) => {
      const fragmentHandle = fragmentHandlesRef.current[fragmentKey];

      if (!fragmentHandle?.mesh) {
        return;
      }

      const nextFragments = fractureMesh({
        inheritedAngularVelocity: fragmentHandle.body?.angvel?.() ?? null,
        inheritedLinearVelocity: fragmentHandle.body?.linvel?.() ?? null,
        sourceGeneration: fragmentHandle.generation,
        sourceMesh: fragmentHandle.mesh,
        worldPoint,
      });

      if (!nextFragments.length) {
        return;
      }

      fragmentHandle.mesh.visible = false;
      setFragmentBodies((currentFragments) => {
        const nextFragmentBodies = currentFragments
          .filter((fragment) => fragment.key !== fragmentKey)
          .concat(nextFragments);

        fragmentBodiesRef.current = nextFragmentBodies;

        return nextFragmentBodies;
      });
    },
    [fractureMesh]
  );

  useFrame(() => {
    const breakEvent = runtime?.getPaneBreakEvent(paneKey);
    const breakEventId = breakEvent?.id ?? 0;
    const paneBroken = runtime?.isPaneBroken(paneKey) ?? false;

    if (
      !paneBroken &&
      (lastBreakIdRef.current || fragmentBodiesRef.current.length)
    ) {
      lastBreakIdRef.current = 0;
      fragmentBodiesRef.current = [];
      fragmentHandlesRef.current = {};
      setFragmentBodies([]);
    }

    if (
      paneBroken &&
      breakEventId > lastBreakIdRef.current &&
      breakEvent?.worldPoint
    ) {
      lastBreakIdRef.current = breakEventId;
      const nextFragmentBodies = fractureMesh({
        sourceGeneration: 0,
        sourceMesh: destructibleMesh,
        worldPoint: breakEvent.worldPoint,
      });

      fragmentBodiesRef.current = nextFragmentBodies;
      setFragmentBodies(nextFragmentBodies);
    }

    destructibleMesh.visible = !paneBroken;
  });

  return (
    <>
      <primitive object={destructibleMesh} />
      {fragmentBodies.map((fragment) => (
        <PinataFragmentRigidBody
          key={fragment.key}
          fragment={fragment}
          fragmentObjectsRef={fragmentObjectsRef}
          fragmentHandlesRef={fragmentHandlesRef}
          onImpact={(worldPoint) =>
            handleFragmentImpact(fragment.key, worldPoint)
          }
          paneKey={paneKey}
        />
      ))}
    </>
  );
}
