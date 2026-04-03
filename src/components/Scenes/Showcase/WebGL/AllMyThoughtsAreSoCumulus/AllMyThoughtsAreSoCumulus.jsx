import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

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
  const size = useThree((state) => state.size);
  const boundsMargin =
    size.width >= size.height
      ? LANDSCAPE_BOUNDS_MARGIN
      : PORTRAIT_BOUNDS_MARGIN;

  // Keep snapshot current for the Leva copy button
  controlsSnapshotRef.current = c;

  // Get camera spline points from preset
  const cameraSplinePreset = CAMERA_SPLINE_PRESETS[c.cameraSplinePreset];
  const isSplineMode = c.cameraMode === 'spline';
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <color attach="background" args={[c.backgroundColor]} />

      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={BASE_CAMERA_POSITION}
        fov={20}
      />

      <ambientLight intensity={c.ambientIntensity} />

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

      {c.spotlightEnabled ? (
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
          makeDefault
          autoRotate={c.autoRotateSpeed !== 0}
          enableDamping
          enablePan
          enableRotate
          enableZoom
          autoRotateSpeed={c.autoRotateSpeed}
        />
      ) : null}

      <Float speed={c.floatSpeed}>
        <Bounds
          fit={!isSplineMode}
          clip
          observe={!isSplineMode}
          margin={boundsMargin}
        >
          <HaloDisplay controls={c} setControls={setControls} />

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

          <SceneFemur
            position={c.femurPosition}
            rotation={c.femurRotation}
            scale={c.femurScale}
            visible={c.femurVisible}
          />
        </Bounds>

        <CensorPanel
          visible={c.censorPanelVisible}
          position={c.censorPanelPosition}
          rotation={c.censorPanelRotation}
          scale={c.censorPanelScale}
          pixelSize={c.censorPixelSize}
          refraction={c.censorRefraction}
          clipOffset={c.censorClipOffset}
        />
      </Float>

      <Environment
        preset="studio"
        environmentIntensity={c.environmentIntensity}
      />

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
