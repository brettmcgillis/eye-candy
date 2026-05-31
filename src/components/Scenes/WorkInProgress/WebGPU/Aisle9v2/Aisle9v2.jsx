import * as THREE from 'three';

import React, { useCallback, useMemo, useState } from 'react';

import CENTER_STORE_REF_POSITION from '../../../../elements/sevenEleven/sevenElevenAnchors';
import CameraRig from '../../../../rigging/CameraRig';
import BlackHoleV2 from './components/BlackHoleV2';
import OrbitingBodies from './components/OrbitingBodies';
import SpaceEnvironment from './components/SpaceEnvironment';
import StoreStage from './components/StoreStage';
import SurveillanceOverlay from './components/SurveillanceOverlay';
import useSceneControls from './hooks/useSceneControls';
import { ENVIRONMENT_SPACE } from './presets/presets';

function toVector3(value) {
  if (value instanceof THREE.Vector3) return value.clone();
  if (Array.isArray(value)) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(value.x ?? 0, value.y ?? 0, value.z ?? 0);
}

function toTuple(vector) {
  return [vector.x, vector.y, vector.z];
}

function transformFrame(frame, matrix, keys = ['position', 'target', 'pivot']) {
  if (!matrix || !frame) return frame;

  const nextFrame = { ...frame };
  keys.forEach((key) => {
    if (!frame[key]) return;
    nextFrame[key] = toTuple(toVector3(frame[key]).applyMatrix4(matrix));
  });

  return nextFrame;
}

function transformResponsiveFrame(frame, matrix) {
  if (!matrix || !frame) return frame;

  return {
    ...frame,
    desktop: transformFrame(frame.desktop, matrix),
    mobile: transformFrame(frame.mobile, matrix),
  };
}

function transformOrbitFrame(frame, matrix) {
  if (!matrix || !frame) return frame;

  return {
    ...frame,
    desktop: transformFrame(frame.desktop, matrix, ['target', 'pivot']),
    mobile: transformFrame(frame.mobile, matrix, ['target', 'pivot']),
  };
}

function transformSpline(spline, matrix) {
  if (!matrix || !spline?.points?.length) return spline;

  const transformedTarget = spline.target
    ? toTuple(toVector3(spline.target).applyMatrix4(matrix))
    : undefined;

  return {
    ...spline,
    target: transformedTarget ?? spline.target,
    desktop: spline.desktop
      ? transformFrame(spline.desktop, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    mobile: spline.mobile
      ? transformFrame(spline.mobile, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    points: spline.points.map((point) => {
      const nextPoint = {
        ...point,
        position: toTuple(toVector3(point.position).applyMatrix4(matrix)),
      };

      if (point.lookAt) {
        nextPoint.lookAt = toTuple(
          toVector3(point.lookAt).applyMatrix4(matrix)
        );
      }

      return nextPoint;
    }),
  };
}

function transformFixed(fixed, matrix) {
  if (!matrix || !fixed?.shots) return fixed;

  return {
    ...fixed,
    shots: Object.fromEntries(
      Object.entries(fixed.shots).map(([id, shot]) => [
        id,
        transformResponsiveFrame(shot, matrix),
      ])
    ),
  };
}

function getStoreFallbackPosition() {
  return {
    x: CENTER_STORE_REF_POSITION.x,
    y: CENTER_STORE_REF_POSITION.y,
    z: CENTER_STORE_REF_POSITION.z,
  };
}

export default function Aisle9v2() {
  const config = useSceneControls();
  const [storeSpace, setStoreSpace] = useState(null);
  const isSpace = config.environment === ENVIRONMENT_SPACE;
  const transformMatrix =
    !isSpace && storeSpace?.storeLocalToWorldMatrix
      ? storeSpace.storeLocalToWorldMatrix
      : null;
  const handleStoreSpaceChange = useCallback((nextStoreSpace) => {
    setStoreSpace({
      centerStoreRefWorldPosition:
        nextStoreSpace.centerStoreRefWorldPosition.clone(),
      storeLocalToWorldMatrix: nextStoreSpace.storeLocalToWorldMatrix.clone(),
    });
  }, []);
  const blackHolePosition = useMemo(() => {
    if (isSpace) return config.blackHolePosition;

    const center = storeSpace?.centerStoreRefWorldPosition;
    if (!center) return getStoreFallbackPosition();

    return { x: center.x, y: center.y, z: center.z };
  }, [config.blackHolePosition, isSpace, storeSpace]);
  const metricWorldScale = isSpace ? 1 : config.storeScale;
  const orbitMinDistance = isSpace
    ? 0.45
    : Math.max(140, config.lensDiameter * metricWorldScale * 0.55);
  const orbitMaxDistance = isSpace
    ? 10
    : Math.max(1400, config.lensDiameter * metricWorldScale * 2.5);
  const effectiveConfig = useMemo(
    () => ({ ...config, blackHolePosition, metricWorldScale }),
    [blackHolePosition, config, metricWorldScale]
  );
  const cameraConfig = useMemo(
    () => ({
      autoFit: config.cameraAutoFit,
      far: config.cameraFar,
      fixed: transformFixed(config.cameraFixed, transformMatrix),
      mode: config.cameraMode,
      near: config.cameraNear,
      orbit: transformOrbitFrame(config.cameraOrbit, transformMatrix),
      spline: transformSpline(config.cameraSpline, transformMatrix),
    }),
    [
      config.cameraAutoFit,
      config.cameraFar,
      config.cameraFixed,
      config.cameraMode,
      config.cameraNear,
      config.cameraOrbit,
      config.cameraSpline,
      transformMatrix,
    ]
  );
  const keyLightPosition = useMemo(
    () =>
      toTuple(toVector3(blackHolePosition).add(new THREE.Vector3(0, 1.2, 0.6))),
    [blackHolePosition]
  );

  return (
    <>
      <CameraRig
        camera={cameraConfig}
        orbitControlsProps={{
          dampingFactor: 0.08,
          enableDamping: true,
          maxDistance: orbitMaxDistance,
          minDistance: orbitMinDistance,
        }}
      />

      {isSpace ? <SpaceEnvironment config={effectiveConfig} /> : null}
      {!isSpace ? (
        <>
          <color attach="background" args={['#111312']} />
          <StoreStage
            onStoreSpaceChange={handleStoreSpaceChange}
            storePosition={config.storePosition}
            storeRotation={config.storeRotation}
            storeScale={config.storeScale}
          />
        </>
      ) : null}

      <ambientLight color="#f4efe6" intensity={isSpace ? 0.75 : 1.6} />
      <pointLight
        color="#ffb05a"
        decay={1.5}
        distance={isSpace ? 10 : 18}
        intensity={isSpace ? 36 : 120}
        position={keyLightPosition}
      />
      <directionalLight color="#d9ecff" intensity={2.2} position={[4, 7, 5]} />

      <BlackHoleV2 config={effectiveConfig} />
      <OrbitingBodies config={effectiveConfig} />
      <SurveillanceOverlay config={effectiveConfig} />
    </>
  );
}
