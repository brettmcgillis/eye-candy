import React from 'react';

import {
  Bounds,
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { GridHelper, PolarGridHelper } from '../../../../rigging/GridHelper';
import CensorPanel from './components/CensorPanel';
import HaloDisplay from './components/HaloDisplay';
import SceneCloud from './components/SceneCloud';
import SceneFemur from './components/SceneFemur';
import SceneSkull from './components/SceneSkull';
import useSceneControls from './hooks/useSceneControls';

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const BASE_CAMERA_POSITION = [4.4, 1.9, 4.9];
const LANDSCAPE_BOUNDS_MARGIN = 1.04;
const PORTRAIT_BOUNDS_MARGIN = 0.9;

export default function AllMyThoughtsAreSoCumulus() {
  const { controls: c, setControls, controlsSnapshotRef } = useSceneControls();
  const size = useThree((state) => state.size);
  const censorPanelVisible =
    c.censorPanelVisible && !c.postPixelationEnabled && !c.postAsciiEnabled;
  const boundsMargin =
    size.width >= size.height
      ? LANDSCAPE_BOUNDS_MARGIN
      : PORTRAIT_BOUNDS_MARGIN;

  // Keep snapshot current for the Leva copy button
  controlsSnapshotRef.current = c;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <PerspectiveCamera makeDefault position={BASE_CAMERA_POSITION} fov={20} />

      <pointLight
        position={[c.plPosition.x, c.plPosition.y, c.plPosition.z]}
        decay={c.plDecay}
        distance={c.plDistance}
        intensity={c.plIntensity}
        castShadow={c.plCastShadow}
      />

      <GridHelper x y z visible={c.showGridHelper} />
      <PolarGridHelper x y z visible={c.showPolarGridHelper} />

      <OrbitControls
        makeDefault
        autoRotate
        enableDamping
        enablePan
        enableRotate
        enableZoom
        autoRotateSpeed={c.autoRotateSpeed}
      />

      <Float speed={c.floatSpeed}>
        <Bounds fit clip observe margin={boundsMargin}>
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
          visible={censorPanelVisible}
          position={c.censorPanelPosition}
          rotation={c.censorPanelRotation}
          scale={c.censorPanelScale}
          pixelSize={c.censorPixelSize}
          refraction={c.censorRefraction}
          clipOffset={c.censorClipOffset}
          tintVisible={c.censorPanelTintVisible}
          tintColor={c.censorPanelTintColor}
          tintOpacity={c.censorPanelTintOpacity}
        />
      </Float>

      <Environment
        preset="studio"
        environmentIntensity={c.environmentIntensity}
      />
    </>
  );
}
