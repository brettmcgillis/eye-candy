import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import FishTank, {
  FISH_TANK_PANE_KEYS,
  FISH_TANK_STATIC_MESH_KEYS,
} from '@elements/fishTank/FishTank';

import getTankLayout from '../utils/tankLayout';
import PinataPane from './PinataPane';
import RockProjectiles from './RockProjectiles';
import TankWater from './TankWater';

const MIN_ASSET_AXIS = 0.0001;
const MISS_DISTANCE = 20;
const POINTER_TAP_THRESHOLD = 8;
const TANK_COLLIDER_MESH_KEYS = new Set([
  'glass_2',
  'glass_5',
  'lid_1',
  'plastic_1',
  'plastic_2',
  'rubber',
]);
const TANK_COLLIDER_FRICTION = 1.05;
const TANK_COLLIDER_RESTITUTION = 0.03;

const sharedPointer = new THREE.Vector2();
const sharedRaycaster = new THREE.Raycaster();
const sharedMissTarget = new THREE.Vector3();

const TankStaticColliderMesh = React.memo(function TankStaticColliderMesh({
  geometry,
  material,
  colliderShape = 'trimesh',
  meshKey,
  meshProps,
}) {
  return (
    <RigidBody
      type="fixed"
      colliders={colliderShape}
      friction={TANK_COLLIDER_FRICTION}
      restitution={TANK_COLLIDER_RESTITUTION}
    >
      <mesh
        key={meshKey}
        castShadow
        receiveShadow
        geometry={geometry}
        material={material}
        {...meshProps}
      />
    </RigidBody>
  );
});

export default function TankShell({
  tank,
  debug,
  externalCollisionObjectsRef,
  fluidCouplersRef,
  rocks,
  runtime,
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const assetGroupRef = useRef(null);
  const collisionObjectsRef = useRef([]);
  const fragmentFluidObjectsRef = useRef({});
  const paneRefs = useRef({});
  const pointerDownRef = useRef(null);
  const measurementRef = useRef(null);
  const projectilesRef = useRef(null);
  const rockFluidObjectsRef = useRef([]);
  const staticMeshRefs = useRef({});
  const waterBoundsRef = useRef(null);
  const [assetBounds, setAssetBounds] = useState(null);
  const { innerDepth, innerWidth, waterHeight, waterY } = getTankLayout(tank);
  const supportsSplash =
    gl?.backend?.isWebGPUBackend === true &&
    Boolean(gl?.backend?.device) &&
    Boolean(gl?.backend?.context) &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.gpu);

  useLayoutEffect(() => {
    if (assetBounds || !measurementRef.current) {
      return;
    }

    const bounds = new THREE.Box3();
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    measurementRef.current.updateWorldMatrix(true, true);
    bounds.setFromObject(measurementRef.current);

    if (!Number.isFinite(bounds.min.x)) {
      return;
    }

    bounds.getCenter(center);
    bounds.getSize(size);

    setAssetBounds({
      center: center.toArray(),
      minY: bounds.min.y,
      size: size.toArray(),
    });
  }, [assetBounds]);

  const assetTransform = useMemo(() => {
    if (!assetBounds) {
      return null;
    }

    const [assetWidth, assetHeight, assetDepth] = assetBounds.size;
    const [centerX, , centerZ] = assetBounds.center;
    const scale = [
      tank.width / Math.max(assetWidth, MIN_ASSET_AXIS),
      tank.height / Math.max(assetHeight, MIN_ASSET_AXIS),
      tank.depth / Math.max(assetDepth, MIN_ASSET_AXIS),
    ];

    return {
      position: [
        -centerX * scale[0],
        -tank.height / 2 - assetBounds.minY * scale[1],
        -centerZ * scale[2],
      ],
      scale,
    };
  }, [assetBounds, tank.depth, tank.height, tank.width]);

  useEffect(() => {
    const { domElement } = gl;

    const clearPointerDown = () => {
      pointerDownRef.current = null;
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) {
        return;
      }

      pointerDownRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    };

    const handlePointerUp = (event) => {
      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;

      if (!pointerDown || event.button !== 0 || !projectilesRef.current) {
        return;
      }

      if (
        Math.hypot(
          event.clientX - pointerDown.clientX,
          event.clientY - pointerDown.clientY
        ) > POINTER_TAP_THRESHOLD
      ) {
        return;
      }

      const rect = domElement.getBoundingClientRect();

      sharedPointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      sharedRaycaster.setFromCamera(sharedPointer, camera);

      const paneHits = sharedRaycaster.intersectObjects(
        FISH_TANK_PANE_KEYS.map((paneKey) => paneRefs.current[paneKey]).filter(
          (pane) => pane && pane.visible
        ),
        false
      );
      const paneHit = paneHits[0] ?? null;

      projectilesRef.current.launch({
        paneKey: paneHit?.object?.userData?.paneKey ?? null,
        targetWorldPoint: paneHit
          ? paneHit.point.clone()
          : sharedRaycaster.ray.at(MISS_DISTANCE, sharedMissTarget.clone()),
      });
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', clearPointerDown);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', clearPointerDown);
    };
  }, [camera, gl]);

  useFrame(() => {
    const activeWaterLevel = runtime
      ? runtime.getWaterLevel()
      : tank.waterLevel;
    const liveLayout = getTankLayout({ ...tank, waterLevel: activeWaterLevel });

    collisionObjectsRef.current = [
      ...(externalCollisionObjectsRef?.current ?? []),
      ...FISH_TANK_STATIC_MESH_KEYS.map(
        (meshKey) => staticMeshRefs.current[meshKey]
      ),
      ...Object.values(fragmentFluidObjectsRef.current),
      ...FISH_TANK_PANE_KEYS.map((paneKey) => paneRefs.current[paneKey]),
    ].filter((mesh) => mesh && mesh.visible);

    const fluidCouplers = fluidCouplersRef?.current;

    if (fluidCouplers) {
      fluidCouplers.splice(
        0,
        fluidCouplers.length,
        ...rockFluidObjectsRef.current,
        ...Object.values(fragmentFluidObjectsRef.current)
      );

      for (let index = fluidCouplers.length - 1; index >= 0; index -= 1) {
        if (!fluidCouplers[index]) {
          fluidCouplers.splice(index, 1);
        }
      }
    }

    if (waterBoundsRef.current) {
      waterBoundsRef.current.position.set(0, liveLayout.waterY, 0);
      waterBoundsRef.current.rotation.set(0, 0, 0);
      waterBoundsRef.current.scale.y = liveLayout.waterHeight + 0.01;
      waterBoundsRef.current.visible =
        debug.showWaterBounds && activeWaterLevel > 0;
    }
  });

  const handleProjectileImpact = (paneKey, impact) => {
    if (runtime) {
      runtime.breakPane(paneKey, impact.localPoint, impact.worldPoint);
    }
  };

  const staticMeshProps = useMemo(
    () =>
      Object.fromEntries(
        FISH_TANK_STATIC_MESH_KEYS.map((meshKey) => [
          meshKey,
          {
            ref: (node) => {
              const staticMeshNode = node;

              staticMeshRefs.current[meshKey] = staticMeshNode;

              if (staticMeshNode) {
                staticMeshNode.userData = {
                  ...staticMeshNode.userData,
                  surfaceKey: meshKey,
                  surfaceType: 'tank-static',
                };
              }
            },
          },
        ])
      ),
    []
  );

  const paneProps = useMemo(
    () =>
      Object.fromEntries(
        FISH_TANK_PANE_KEYS.map((paneKey) => [
          paneKey,
          {
            ref: (node) => {
              const paneNode = node;

              paneRefs.current[paneKey] = paneNode;

              if (paneNode) {
                paneNode.userData = {
                  ...paneNode.userData,
                  paneKey,
                  surfaceType: 'tank-pane',
                };
              }
            },
          },
        ])
      ),
    []
  );

  const renderStaticMesh = useCallback(
    ({ geometry, material, meshKey, meshProps }) => {
      if (!TANK_COLLIDER_MESH_KEYS.has(meshKey)) {
        return (
          <mesh
            key={meshKey}
            castShadow
            receiveShadow
            geometry={geometry}
            material={material}
            {...meshProps}
          />
        );
      }

      return (
        <TankStaticColliderMesh
          key={meshKey}
          colliderShape="trimesh"
          geometry={geometry}
          material={material}
          meshKey={meshKey}
          meshProps={meshProps}
        />
      );
    },
    []
  );

  const renderPane = useCallback(
    ({ geometry, material, paneKey, paneProps: nextPaneProps }) => (
      <PinataPane
        key={paneKey}
        assetGroupRef={assetGroupRef}
        fragmentObjectsRef={fragmentFluidObjectsRef}
        geometry={geometry}
        material={material}
        paneKey={paneKey}
        paneProps={nextPaneProps}
        runtime={runtime}
        tank={tank}
      />
    ),
    [runtime, tank]
  );

  return (
    <>
      {!assetBounds && (
        <group visible={false}>
          <FishTank ref={measurementRef} />
        </group>
      )}

      {tank.visible && (
        <>
          <RockProjectiles
            collisionObjectsRef={collisionObjectsRef}
            fluidObjectsRef={rockFluidObjectsRef}
            ref={projectilesRef}
            onImpact={handleProjectileImpact}
            rocks={rocks}
            runtime={runtime}
          />

          {assetTransform && (
            <group
              ref={assetGroupRef}
              position={assetTransform.position}
              scale={assetTransform.scale}
            >
              <FishTank
                glassColor={tank.glassColor}
                glassOpacity={tank.glassOpacity}
                paneProps={paneProps}
                renderPane={renderPane}
                renderStaticMesh={renderStaticMesh}
                sandColor={tank.sandColor}
                staticMeshProps={staticMeshProps}
              />
            </group>
          )}

          <TankWater
            fluidCouplersRef={fluidCouplersRef}
            runtime={runtime}
            showWaterBounds={debug.showWaterBounds}
            tank={tank}
          />
        </>
      )}

      {debug.showTankBounds && (
        <mesh>
          <boxGeometry
            args={[tank.width + 0.01, tank.height + 0.01, tank.depth + 0.01]}
          />
          <meshBasicMaterial
            color="#f97316"
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      )}

      {debug.showWaterBounds && !supportsSplash && (
        <mesh
          ref={waterBoundsRef}
          position={[0, waterY, 0]}
          scale={[1, waterHeight + 0.01, 1]}
        >
          <boxGeometry args={[innerWidth + 0.01, 1, innerDepth + 0.01]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      )}
    </>
  );
}
