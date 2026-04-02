import React from 'react';

import {
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import { useSkullControls } from '../../../../elements/skull/SkullControls';
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

export default function AllMyThoughtsAreSoCumulus() {
  const { controls: c, setControls, controlsSnapshotRef } = useSceneControls();
  const censorPanelVisible =
    c.censorPanelVisible && !c.postPixelationEnabled && !c.postAsciiEnabled;

  // Keep snapshot current for the Leva copy button
  controlsSnapshotRef.current = c;

  // Skull bone-visibility controls (own Leva panel)
  const skullControls = useSkullControls({
    controlName: 'Skull Settings',
    collapsed: true,
    cranium: {
      showRightParietal: false,
      showRightTemporal: false,
      showTeeth: false,
      showLeftParietal: false,
      showLeftTemporal: false,
    },
    mandible: { showMandible: false },
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <PerspectiveCamera makeDefault position={[-1, -1, 3.5]} />

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
        autoRotate
        enableDamping
        enablePan
        enableRotate
        enableZoom
        autoRotateSpeed={c.autoRotateSpeed}
      />

      <Float speed={c.floatSpeed}>
        <HaloDisplay controls={c} setControls={setControls} />

        <SceneSkull
          position={c.skullPosition}
          rotation={c.skullRotation}
          scale={c.skullScale}
          visible={c.skullVisible}
          {...skullControls}
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
