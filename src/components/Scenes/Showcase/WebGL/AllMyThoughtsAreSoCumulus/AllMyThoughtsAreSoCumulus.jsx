import * as THREE from 'three';

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Bounds,
  Environment,
  Float,
  Line,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import useCameraFitToViewport from '../../../../../hooks/useCameraFitToViewport';
import useOperatorFreeCamera from '../../../../../hooks/useOperatorFreeCamera';
import useOperatorInput from '../../../../../hooks/useOperatorInput';
import CAMERA_SPLINE_PRESETS from '../../../../../presets/spline/cameraSplinePresets';
import { GridHelper, PolarGridHelper } from '../../../../rigging/GridHelper';
import CensorPanel from './components/CensorPanel';
import HaloDisplay from './components/HaloDisplay';
import SceneCloud from './components/SceneCloud';
import SceneFemur from './components/SceneFemur';
import SceneSkull from './components/SceneSkull';
import useCameraSpline from './hooks/useCameraSpline';
import useSceneControls from './hooks/useSceneControls';

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const BASE_CAMERA_POSITION = [-4.7, 2.6, 5.9];
const LANDSCAPE_BOUNDS_MARGIN = 1.04;
const PORTRAIT_BOUNDS_MARGIN = 0.9;

export default function AllMyThoughtsAreSoCumulus() {
  const { controls: c, setControls, controlsSnapshotRef } = useSceneControls();
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [cameraNode, setCameraNode] = useState(null);
  const [controlsNode, setControlsNode] = useState(null);
  const size = useThree((state) => state.size);
  const boundsMargin =
    size.width >= size.height
      ? LANDSCAPE_BOUNDS_MARGIN
      : PORTRAIT_BOUNDS_MARGIN;
  const isFixedMode = c.cameraMode === 'fixed';
  const isOrbitMode = c.cameraMode === 'orbit';
  const isOperatorMode = c.cameraMode === 'operator';
  const handleCameraRef = useCallback((node) => {
    cameraRef.current = node;
    setCameraNode(node);
  }, []);
  const handleControlsRef = useCallback((node) => {
    controlsRef.current = node;
    setControlsNode(node);
  }, []);

  // Keep snapshot current for the Leva copy button
  controlsSnapshotRef.current = c;

  // Get camera spline points from preset
  const cameraSplinePreset = CAMERA_SPLINE_PRESETS[c.cameraSplinePreset];
  const isSplineMode = c.cameraMode === 'spline';
  const shouldOverrideOrbitTarget = isOrbitMode && c.orbitCameraUseCustomTarget;
  const shouldFitOrbitBounds = isOrbitMode && !shouldOverrideOrbitTarget;
  const orbitCameraTarget = useMemo(
    () => [c.orbitCameraTarget.x, c.orbitCameraTarget.y, c.orbitCameraTarget.z],
    [c.orbitCameraTarget.x, c.orbitCameraTarget.y, c.orbitCameraTarget.z]
  );
  const fixedCameraConfig = useMemo(
    () => ({
      desktopPosition: [
        c.fixedCameraDesktopPosition.x,
        c.fixedCameraDesktopPosition.y,
        c.fixedCameraDesktopPosition.z,
      ],
      desktopTarget: [
        c.fixedCameraDesktopTarget.x,
        c.fixedCameraDesktopTarget.y,
        c.fixedCameraDesktopTarget.z,
      ],
      desktopFov: c.fixedCameraDesktopFov,
      mobilePosition: [
        c.fixedCameraMobilePosition.x,
        c.fixedCameraMobilePosition.y,
        c.fixedCameraMobilePosition.z,
      ],
      mobileTarget: [
        c.fixedCameraMobileTarget.x,
        c.fixedCameraMobileTarget.y,
        c.fixedCameraMobileTarget.z,
      ],
      mobileFov: c.fixedCameraMobileFov,
    }),
    [
      c.fixedCameraDesktopFov,
      c.fixedCameraDesktopPosition.x,
      c.fixedCameraDesktopPosition.y,
      c.fixedCameraDesktopPosition.z,
      c.fixedCameraDesktopTarget.x,
      c.fixedCameraDesktopTarget.y,
      c.fixedCameraDesktopTarget.z,
      c.fixedCameraMobileFov,
      c.fixedCameraMobilePosition.x,
      c.fixedCameraMobilePosition.y,
      c.fixedCameraMobilePosition.z,
      c.fixedCameraMobileTarget.x,
      c.fixedCameraMobileTarget.y,
      c.fixedCameraMobileTarget.z,
    ]
  );
  const {
    cameraPosition: fixedCameraPosition,
    cameraTarget: fixedCameraTarget,
    cameraFov: fixedCameraFov,
  } = useCameraFitToViewport(fixedCameraConfig);
  const activeOrbitCameraTarget = useMemo(
    () =>
      c.preset === 'Universal' && shouldOverrideOrbitTarget
        ? fixedCameraTarget
        : orbitCameraTarget,
    [c.preset, fixedCameraTarget, orbitCameraTarget, shouldOverrideOrbitTarget]
  );
  const operatorInputRef = useOperatorInput({ enabled: isOperatorMode });
  const operatorCamera = useMemo(
    () => ({
      moveSpeed: c.operatorMoveSpeed,
      liftSpeed: c.operatorLiftSpeed,
      boostMultiplier: c.operatorBoostMultiplier,
      pointerLookSensitivity: c.operatorPointerLookSensitivity,
      stickLookSpeed: c.operatorStickLookSpeed,
      zoomSpeed: c.operatorZoomSpeed,
      minFov: Math.min(c.operatorMinFov, c.operatorMaxFov),
      maxFov: Math.max(c.operatorMinFov, c.operatorMaxFov),
    }),
    [
      c.operatorBoostMultiplier,
      c.operatorLiftSpeed,
      c.operatorMaxFov,
      c.operatorMinFov,
      c.operatorMoveSpeed,
      c.operatorPointerLookSensitivity,
      c.operatorStickLookSpeed,
      c.operatorZoomSpeed,
    ]
  );
  const cameraSplineClosed = cameraSplinePreset?.closed ?? true;
  const cameraSplinePoints = useMemo(() => {
    const sourcePoints = cameraSplinePreset?.points || [];
    const positionOffset = new THREE.Vector3(
      c.cameraSplinePosition.x,
      c.cameraSplinePosition.y,
      c.cameraSplinePosition.z
    );
    const scale = new THREE.Vector3(
      c.cameraSplineScale.x,
      c.cameraSplineScale.y,
      c.cameraSplineScale.z
    );

    return sourcePoints.map((point) => ({
      // Keep path transform, but force camera target to come from global Look At
      position: point.position.clone().multiply(scale).add(positionOffset),
    }));
  }, [
    cameraSplinePreset,
    c.cameraSplinePosition.x,
    c.cameraSplinePosition.y,
    c.cameraSplinePosition.z,
    c.cameraSplineScale.x,
    c.cameraSplineScale.y,
    c.cameraSplineScale.z,
  ]);

  const cameraSplinePathPoints = useMemo(() => {
    if (cameraSplinePoints.length < 2) return [];

    const splineCurve = new THREE.CatmullRomCurve3(
      cameraSplinePoints.map((point) => point.position.clone()),
      cameraSplineClosed,
      'centripetal',
      c.cameraSplineTension
    );

    return splineCurve.getPoints(200);
  }, [cameraSplinePoints, cameraSplineClosed, c.cameraSplineTension]);

  // Use camera spline for dynamic motion
  useCameraSpline({
    enabled: isSplineMode,
    cameraRef,
    points: cameraSplinePoints,
    duration: c.cameraSplineDuration,
    tension: c.cameraSplineTension,
    closed: cameraSplineClosed,
    lookAt: [
      c.cameraSplineLookAt.x,
      c.cameraSplineLookAt.y,
      c.cameraSplineLookAt.z,
    ],
  });

  useOperatorFreeCamera({
    enabled: isOperatorMode,
    inputRef: operatorInputRef,
    config: operatorCamera,
  });

  useLayoutEffect(() => {
    if (!isFixedMode || !cameraNode) {
      return;
    }

    const camera = cameraNode;
    camera.position.set(...fixedCameraPosition);
    camera.fov = fixedCameraFov;
    camera.updateProjectionMatrix();

    if (!controlsNode) {
      camera.lookAt(...fixedCameraTarget);
      return;
    }

    controlsNode.target.set(...fixedCameraTarget);
    controlsNode.update();
  }, [
    cameraNode,
    controlsNode,
    fixedCameraFov,
    fixedCameraPosition,
    fixedCameraTarget,
    isFixedMode,
  ]);

  useLayoutEffect(() => {
    if (!shouldOverrideOrbitTarget || !cameraNode || !controlsNode) {
      return;
    }

    cameraNode.position.set(...fixedCameraPosition);
    cameraNode.fov = fixedCameraFov;
    cameraNode.updateProjectionMatrix();
    controlsNode.target.set(...activeOrbitCameraTarget);
    controlsNode.update();
  }, [
    activeOrbitCameraTarget,
    cameraNode,
    controlsNode,
    fixedCameraFov,
    fixedCameraPosition,
    shouldOverrideOrbitTarget,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <color attach="background" args={[c.backgroundColor]} />

      <PerspectiveCamera
        ref={handleCameraRef}
        makeDefault
        position={BASE_CAMERA_POSITION}
        fov={20}
      />

      <ambientLight intensity={c.ambientIntensity} />

      {c.plIntensity > 0 ? (
        <pointLight
          position={[c.plPosition.x, c.plPosition.y, c.plPosition.z]}
          decay={c.plDecay}
          distance={c.plDistance}
          intensity={c.plIntensity}
          castShadow={c.plCastShadow}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0002}
        />
      ) : null}

      {c.spotlightEnabled && c.spotlightIntensity > 0 ? (
        <spotLight
          position={[
            c.spotlightPosition.x,
            c.spotlightPosition.y,
            c.spotlightPosition.z,
          ]}
          angle={c.spotlightAngle}
          penumbra={c.spotlightPenumbra}
          intensity={c.spotlightIntensity}
          color={c.spotlightColor}
          castShadow={c.spotlightCastShadow}
        />
      ) : null}

      <GridHelper x y z visible={c.showGridHelper} />
      <PolarGridHelper x y z visible={c.showPolarGridHelper} />

      {c.cameraSplineShowPath && cameraSplinePathPoints.length > 1 ? (
        <Line
          points={cameraSplinePathPoints}
          color={c.cameraSplinePathColor}
          lineWidth={c.cameraSplinePathWidth}
        />
      ) : null}

      {!isSplineMode ? (
        <OrbitControls
          ref={handleControlsRef}
          makeDefault
          autoRotate={isOrbitMode && c.autoRotateSpeed !== 0}
          enableDamping
          enabled={isOrbitMode}
          enablePan={isOrbitMode}
          enableRotate={isOrbitMode}
          enableZoom={isOrbitMode}
          autoRotateSpeed={c.autoRotateSpeed}
        />
      ) : null}

      <Float speed={c.floatSpeed}>
        <Bounds
          fit={shouldFitOrbitBounds}
          clip
          observe={shouldFitOrbitBounds}
          margin={boundsMargin}
        >
          <HaloDisplay controls={c} setControls={setControls} />

          {c.skullVisible ? (
            <SceneSkull
              position={c.skullPosition}
              rotation={c.skullRotation}
              scale={c.skullScale}
              visible={c.skullVisible}
              showCranium={c.showCranium}
              showLeftZygomatic={c.showLeftZygomatic}
              showOccipital={c.showOccipital}
              showRightLacrimal={c.showRightLacrimal}
              showRightMaxilla={c.showRightMaxilla}
              showRightNasal={c.showRightNasal}
              showRightPalatine={c.showRightPalatine}
              showRightParietal={c.showRightParietal}
              showRightTemporal={c.showRightTemporal}
              showRightZygomatic={c.showRightZygomatic}
              showSphenoid={c.showSphenoid}
              showTeeth={c.showTeeth}
              showVomer={c.showVomer}
              showEthmoid={c.showEthmoid}
              showFrontal={c.showFrontal}
              showInferiorConchae={c.showInferiorConchae}
              showLeftLacrimal={c.showLeftLacrimal}
              showLeftMaxilla={c.showLeftMaxilla}
              showLeftNasal={c.showLeftNasal}
              showLeftPalatine={c.showLeftPalatine}
              showLeftParietal={c.showLeftParietal}
              showLeftTemporal={c.showLeftTemporal}
              showMandible={c.showMandible}
              showMandibleBone={c.showMandibleBone}
              showMandibleTeeth={c.showMandibleTeeth}
            />
          ) : null}

          {c.cloudVisible ? (
            <SceneCloud
              position={c.cloudPosition}
              rotation={c.cloudRotation}
              scale={c.cloudScale}
              visible={c.cloudVisible}
              seed={c.cloudSeed}
              segments={c.cloudSegments}
              volume={c.cloudVolume}
              opacity={c.cloudOpacity}
              fade={c.cloudFade}
              growth={c.cloudGrowth}
              speed={c.cloudSpeed}
              boundsX={c.cloudBoundsX}
              boundsY={c.cloudBoundsY}
              boundsZ={c.cloudBoundsZ}
              color={c.cloudColor}
            />
          ) : null}

          {c.femurVisible ? (
            <SceneFemur
              position={c.femurPosition}
              rotation={c.femurRotation}
              scale={c.femurScale}
              visible={c.femurVisible}
            />
          ) : null}
        </Bounds>

        {c.censorPanelVisible ? (
          <CensorPanel
            visible={c.censorPanelVisible}
            position={c.censorPanelPosition}
            rotation={c.censorPanelRotation}
            scale={c.censorPanelScale}
            pixelSize={c.censorPixelSize}
            refraction={c.censorRefraction}
            clipOffset={c.censorClipOffset}
          />
        ) : null}
      </Float>

      {c.environmentIntensity > 0 ? (
        <Environment
          preset="studio"
          environmentIntensity={c.environmentIntensity}
        />
      ) : null}

      {c.bloomEnabled ? (
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom
            intensity={c.bloomIntensity}
            luminanceThreshold={c.bloomLuminanceThreshold}
            luminanceSmoothing={c.bloomLuminanceSmoothing}
            mipmapBlur
            radius={c.bloomRadius}
          />
        </EffectComposer>
      ) : null}
    </>
  );
}
