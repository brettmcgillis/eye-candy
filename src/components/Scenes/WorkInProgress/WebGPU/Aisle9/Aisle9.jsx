import * as THREE from 'three';

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useCameraFitToViewport from '../../../../../hooks/useCameraFitToViewport';
import useCameraSpline from '../../../../../hooks/useCameraSpline';
import AISLE9_CAMERA_SPLINES from '../../../../../presets/spline/aisle9CameraSplines';
import CENTER_STORE_REF_POSITION from '../../../../elements/sevenEleven/sevenElevenAnchors';
import PostEffects from './components/PostEffects';
import SevenElevenStage from './components/SevenElevenStage';
import useSceneControls from './hooks/useSceneControls';

export default function Aisle9() {
  const config = useSceneControls();
  const cameraRef = useRef(null);
  const [cameraNode, setCameraNode] = useState(null);
  const [controlsNode, setControlsNode] = useState(null);
  const [resolvedStoreSpace, setResolvedStoreSpace] = useState(null);
  const isStoreWarp = config.presentationMode === 'storeWarp';
  const isFixedMode = config.cameraMode === 'fixed';
  const isSplineMode = config.cameraMode === 'spline';
  const handleCameraRef = useCallback((node) => {
    cameraRef.current = node;
    setCameraNode(node);
  }, []);
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
  const cameraSplinePreset = AISLE9_CAMERA_SPLINES[config.cameraSplinePreset];
  const cameraSplineClosed = cameraSplinePreset?.closed ?? true;
  const storeLocalToWorldMatrix =
    isStoreWarp && resolvedStoreSpace?.storeLocalToWorldMatrix
      ? resolvedStoreSpace.storeLocalToWorldMatrix
      : null;

  const orbitCameraFitConfig = useMemo(
    () => ({
      desktopPosition: [
        config.cameraPosition.x,
        config.cameraPosition.y,
        config.cameraPosition.z,
      ],
      desktopTarget: [
        config.cameraTarget.x,
        config.cameraTarget.y,
        config.cameraTarget.z,
      ],
      desktopFov: config.cameraFov,
      mobilePosition: [
        config.cameraMobilePosition.x,
        config.cameraMobilePosition.y,
        config.cameraMobilePosition.z,
      ],
      mobileTarget: [
        config.cameraMobileTarget.x,
        config.cameraMobileTarget.y,
        config.cameraMobileTarget.z,
      ],
      mobileFov: config.cameraMobileFov,
    }),
    [
      config.cameraFov,
      config.cameraMobileFov,
      config.cameraMobilePosition.x,
      config.cameraMobilePosition.y,
      config.cameraMobilePosition.z,
      config.cameraMobileTarget.x,
      config.cameraMobileTarget.y,
      config.cameraMobileTarget.z,
      config.cameraPosition.x,
      config.cameraPosition.y,
      config.cameraPosition.z,
      config.cameraTarget.x,
      config.cameraTarget.y,
      config.cameraTarget.z,
    ]
  );
  const {
    cameraFov: responsiveCameraFov,
    cameraPosition: responsiveOrbitCameraPosition,
    cameraTarget: responsiveOrbitCameraTarget,
  } = useCameraFitToViewport(orbitCameraFitConfig);

  const fixedCameraFitConfig = useMemo(
    () => ({
      desktopPosition: [
        config.fixedCameraPosition.x,
        config.fixedCameraPosition.y,
        config.fixedCameraPosition.z,
      ],
      desktopTarget: [
        config.fixedCameraTarget.x,
        config.fixedCameraTarget.y,
        config.fixedCameraTarget.z,
      ],
      desktopFov: config.cameraFov,
      mobilePosition: [
        config.fixedCameraMobilePosition.x,
        config.fixedCameraMobilePosition.y,
        config.fixedCameraMobilePosition.z,
      ],
      mobileTarget: [
        config.fixedCameraMobileTarget.x,
        config.fixedCameraMobileTarget.y,
        config.fixedCameraMobileTarget.z,
      ],
      mobileFov: config.cameraMobileFov,
    }),
    [
      config.cameraFov,
      config.cameraMobileFov,
      config.fixedCameraMobilePosition.x,
      config.fixedCameraMobilePosition.y,
      config.fixedCameraMobilePosition.z,
      config.fixedCameraMobileTarget.x,
      config.fixedCameraMobileTarget.y,
      config.fixedCameraMobileTarget.z,
      config.fixedCameraPosition.x,
      config.fixedCameraPosition.y,
      config.fixedCameraPosition.z,
      config.fixedCameraTarget.x,
      config.fixedCameraTarget.y,
      config.fixedCameraTarget.z,
    ]
  );
  const {
    cameraPosition: responsiveFixedCameraPosition,
    cameraTarget: responsiveFixedCameraTarget,
  } = useCameraFitToViewport(fixedCameraFitConfig);

  const fixedCameraPosition = useMemo(() => {
    const position = new THREE.Vector3(
      responsiveFixedCameraPosition[0],
      responsiveFixedCameraPosition[1],
      responsiveFixedCameraPosition[2]
    );

    if (storeLocalToWorldMatrix) {
      position.applyMatrix4(storeLocalToWorldMatrix);
    }

    return position;
  }, [responsiveFixedCameraPosition, storeLocalToWorldMatrix]);

  const fixedCameraTarget = useMemo(() => {
    const target = new THREE.Vector3(
      responsiveFixedCameraTarget[0],
      responsiveFixedCameraTarget[1],
      responsiveFixedCameraTarget[2]
    );

    if (storeLocalToWorldMatrix) {
      target.applyMatrix4(storeLocalToWorldMatrix);
    }

    return target;
  }, [responsiveFixedCameraTarget, storeLocalToWorldMatrix]);

  const orbitCameraTarget = useMemo(() => {
    const target = new THREE.Vector3(
      responsiveOrbitCameraTarget[0],
      responsiveOrbitCameraTarget[1],
      responsiveOrbitCameraTarget[2]
    );

    if (storeLocalToWorldMatrix) {
      target.applyMatrix4(storeLocalToWorldMatrix);
    }

    return target;
  }, [responsiveOrbitCameraTarget, storeLocalToWorldMatrix]);

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

    return responsiveOrbitCameraPosition;
  }, [
    cameraSplinePoints,
    fixedCameraPosition.x,
    fixedCameraPosition.y,
    fixedCameraPosition.z,
    isFixedMode,
    isSplineMode,
    responsiveOrbitCameraPosition,
  ]);

  const activeOrbitTarget = useMemo(() => {
    if (isStoreWarp) {
      return [orbitCameraTarget.x, orbitCameraTarget.y, orbitCameraTarget.z];
    }

    return responsiveOrbitCameraTarget;
  }, [
    isStoreWarp,
    orbitCameraTarget.x,
    orbitCameraTarget.y,
    orbitCameraTarget.z,
    responsiveOrbitCameraTarget,
  ]);

  useLayoutEffect(() => {
    if (!cameraNode) {
      return;
    }

    cameraNode.fov = responsiveCameraFov;
    cameraNode.updateProjectionMatrix();

    if (isSplineMode) {
      return;
    }

    cameraNode.position.set(...activeCameraPosition);

    if (isFixedMode) {
      cameraNode.lookAt(fixedCameraTarget);
      return;
    }

    if (!controlsNode) {
      cameraNode.lookAt(...activeOrbitTarget);
      return;
    }

    controlsNode.target.set(...activeOrbitTarget);
    controlsNode.update();
  }, [
    activeCameraPosition,
    activeOrbitTarget,
    cameraNode,
    controlsNode,
    fixedCameraTarget,
    isFixedMode,
    isSplineMode,
    responsiveCameraFov,
  ]);

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
        ref={handleCameraRef}
        makeDefault
        fov={responsiveCameraFov}
        near={config.cameraNear}
        far={config.cameraFar}
        position={activeCameraPosition}
      />
      {!isSplineMode && !isFixedMode ? (
        <OrbitControls
          ref={setControlsNode}
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
