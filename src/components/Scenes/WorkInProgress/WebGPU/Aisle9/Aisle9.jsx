import * as THREE from 'three';

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useCameraSpline from '../../../../../hooks/useCameraSpline';
import AISLE9_CAMERA_SPLINES from '../../../../../presets/spline/aisle9CameraSplines';
import CENTER_STORE_REF_POSITION from '../../../../elements/sevenEleven/sevenElevenAnchors';
import PostEffects from './components/PostEffects';
import SevenElevenStage from './components/SevenElevenStage';
import useSceneControls from './hooks/useSceneControls';

export default function Aisle9() {
  const config = useSceneControls();
  const cameraRef = useRef(null);
  const [resolvedStoreSpace, setResolvedStoreSpace] = useState(null);
  const isStoreWarp = config.presentationMode === 'storeWarp';
  const isFixedMode = config.cameraMode === 'fixed';
  const isSplineMode = config.cameraMode === 'spline';
  const handleStoreSpaceChange = useCallback(
    ({ centerStoreRefWorldPosition, storeLocalToWorldMatrix }) => {
      setResolvedStoreSpace({
        centerStoreRefWorldPosition: centerStoreRefWorldPosition.clone(),
        storeLocalToWorldMatrix: storeLocalToWorldMatrix.clone(),
      });
    },
    []
  );
  const effectiveBlackHolePosition = useMemo(() => {
    if (!isStoreWarp) {
      return config.blackHolePosition;
    }

    if (resolvedStoreSpace?.centerStoreRefWorldPosition) {
      return {
        x: resolvedStoreSpace.centerStoreRefWorldPosition.x,
        y: resolvedStoreSpace.centerStoreRefWorldPosition.y,
        z: resolvedStoreSpace.centerStoreRefWorldPosition.z,
      };
    }

    return {
      x: CENTER_STORE_REF_POSITION.x,
      y: CENTER_STORE_REF_POSITION.y,
      z: CENTER_STORE_REF_POSITION.z,
    };
  }, [config.blackHolePosition, isStoreWarp, resolvedStoreSpace]);
  const effectiveSplineLookAt = useMemo(
    () =>
      isStoreWarp ? effectiveBlackHolePosition : config.cameraSplineLookAt,
    [config.cameraSplineLookAt, effectiveBlackHolePosition, isStoreWarp]
  );
  const effectiveConfig = useMemo(
    () => ({
      ...config,
      blackHolePosition: effectiveBlackHolePosition,
    }),
    [config, effectiveBlackHolePosition]
  );
  const { cameraPosition, cameraTarget } = config;
  const cameraSplinePreset = AISLE9_CAMERA_SPLINES[config.cameraSplinePreset];
  const cameraSplineClosed = cameraSplinePreset?.closed ?? true;
  const storeLocalToWorldMatrix =
    isStoreWarp && resolvedStoreSpace?.storeLocalToWorldMatrix
      ? resolvedStoreSpace.storeLocalToWorldMatrix
      : null;

  const fixedCameraPosition = useMemo(() => {
    const position = new THREE.Vector3(
      config.fixedCameraPosition.x,
      config.fixedCameraPosition.y,
      config.fixedCameraPosition.z
    );

    if (storeLocalToWorldMatrix) {
      position.applyMatrix4(storeLocalToWorldMatrix);
    }

    return position;
  }, [
    config.fixedCameraPosition.x,
    config.fixedCameraPosition.y,
    config.fixedCameraPosition.z,
    storeLocalToWorldMatrix,
  ]);

  const fixedCameraTarget = useMemo(() => {
    const target = new THREE.Vector3(
      config.fixedCameraTarget.x,
      config.fixedCameraTarget.y,
      config.fixedCameraTarget.z
    );

    if (storeLocalToWorldMatrix) {
      target.applyMatrix4(storeLocalToWorldMatrix);
    }

    return target;
  }, [
    config.fixedCameraTarget.x,
    config.fixedCameraTarget.y,
    config.fixedCameraTarget.z,
    storeLocalToWorldMatrix,
  ]);

  const orbitCameraTarget = useMemo(() => {
    const target = new THREE.Vector3(
      config.cameraTarget.x,
      config.cameraTarget.y,
      config.cameraTarget.z
    );

    if (storeLocalToWorldMatrix) {
      target.applyMatrix4(storeLocalToWorldMatrix);
    }

    return target;
  }, [
    config.cameraTarget.x,
    config.cameraTarget.y,
    config.cameraTarget.z,
    storeLocalToWorldMatrix,
  ]);

  const cameraSplinePoints = useMemo(() => {
    const sourcePoints = cameraSplinePreset?.points || [];
    const positionOffset = new THREE.Vector3(
      config.cameraSplinePosition.x,
      config.cameraSplinePosition.y,
      config.cameraSplinePosition.z
    );
    const scale = new THREE.Vector3(
      config.cameraSplineScale.x,
      config.cameraSplineScale.y,
      config.cameraSplineScale.z
    );
    return sourcePoints.map((point, index) => {
      const transformedPoint = {};
      const position = point.position
        .clone()
        .multiply(scale)
        .add(positionOffset);

      if (storeLocalToWorldMatrix) {
        position.applyMatrix4(storeLocalToWorldMatrix);
      }

      transformedPoint.position = position;

      if (point.lookAt instanceof THREE.Vector3) {
        const lookAt = point.lookAt.clone().multiply(scale).add(positionOffset);

        if (storeLocalToWorldMatrix) {
          lookAt.applyMatrix4(storeLocalToWorldMatrix);
        }

        transformedPoint.lookAt = lookAt;
      } else if (sourcePoints.length > 1) {
        const nextPoint = sourcePoints[(index + 1) % sourcePoints.length];
        const lookAt = nextPoint.position
          .clone()
          .multiply(scale)
          .add(positionOffset);

        if (storeLocalToWorldMatrix) {
          lookAt.applyMatrix4(storeLocalToWorldMatrix);
        }

        transformedPoint.lookAt = lookAt;
      }

      return transformedPoint;
    });
  }, [
    cameraSplinePreset,
    config.cameraSplinePosition.x,
    config.cameraSplinePosition.y,
    config.cameraSplinePosition.z,
    config.cameraSplineScale.x,
    config.cameraSplineScale.y,
    config.cameraSplineScale.z,
    isStoreWarp,
    resolvedStoreSpace,
  ]);

  const activeCameraPosition = useMemo(() => {
    if (isFixedMode) {
      return [
        fixedCameraPosition.x,
        fixedCameraPosition.y,
        fixedCameraPosition.z,
      ];
    }

    if (isSplineMode && cameraSplinePoints[0]?.position) {
      const { x, y, z } = cameraSplinePoints[0].position;
      return [x, y, z];
    }

    return [cameraPosition.x, cameraPosition.y, cameraPosition.z];
  }, [
    cameraPosition.x,
    cameraPosition.y,
    cameraPosition.z,
    cameraSplinePoints,
    fixedCameraPosition.x,
    fixedCameraPosition.y,
    fixedCameraPosition.z,
    isFixedMode,
    isSplineMode,
  ]);

  const activeOrbitTarget = useMemo(() => {
    if (isStoreWarp) {
      return [orbitCameraTarget.x, orbitCameraTarget.y, orbitCameraTarget.z];
    }

    return [cameraTarget.x, cameraTarget.y, cameraTarget.z];
  }, [
    cameraTarget.x,
    cameraTarget.y,
    cameraTarget.z,
    isStoreWarp,
    orbitCameraTarget.x,
    orbitCameraTarget.y,
    orbitCameraTarget.z,
  ]);

  useLayoutEffect(() => {
    if (!isFixedMode || !cameraRef.current) {
      return;
    }

    cameraRef.current.lookAt(fixedCameraTarget);
    cameraRef.current.updateProjectionMatrix();
  }, [fixedCameraTarget, isFixedMode]);

  useCameraSpline({
    enabled: isSplineMode,
    cameraRef,
    points: cameraSplinePoints,
    duration: config.cameraSplineDuration,
    tension: config.cameraSplineTension,
    closed: cameraSplineClosed,
    lookAt: [
      effectiveSplineLookAt.x,
      effectiveSplineLookAt.y,
      effectiveSplineLookAt.z,
    ],
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={config.cameraFov}
        near={config.cameraNear}
        far={config.cameraFar}
        position={activeCameraPosition}
      />
      {!isSplineMode && !isFixedMode ? (
        <OrbitControls
          makeDefault
          autoRotate={config.cameraAutoRotate}
          enableDamping
          dampingFactor={config.cameraDampingFactor}
          rotateSpeed={config.cameraRotateSpeed}
          minDistance={config.cameraMinDistance}
          maxDistance={config.cameraMaxDistance}
          target={activeOrbitTarget}
        />
      ) : null}

      <color attach="background" args={[config.starBackgroundColor]} />

      <ambientLight intensity={0.85} color="#f5f0e8" />
      <pointLight
        color="#ffd089"
        intensity={260}
        distance={40}
        decay={1.6}
        position={[0, 0, 0]}
      />
      <directionalLight
        color="#e7f2ff"
        intensity={1.75}
        position={[18, 12, 10]}
      />

      {isStoreWarp ? (
        <SevenElevenStage
          onStoreSpaceChange={handleStoreSpaceChange}
          storeScale={config.storeScale}
          storePosition={config.storePosition}
          storeRotation={config.storeRotation}
        />
      ) : null}

      <PostEffects config={effectiveConfig} />
    </>
  );
}
