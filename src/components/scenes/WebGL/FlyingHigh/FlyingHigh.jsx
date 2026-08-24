import React, { useMemo } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import Boeing737 from '@elements/Boeing737/Boeing737';
import Moon from '@elements/Moon/Moon';
import { getSplineWorldPoints } from '@elements/SplineGroup/splineDefaults';
import FLYING_HIGH_FIRE from '@presets/fire/flyingHighFire';

import EngineFire from './components/EngineFire';
import SceneClouds from './components/SceneClouds';
import SkyPanel from './components/SkyPanel';
import useSceneControls from './hooks/useSceneControls';

// ─── Scene ───────────────────────────────────────────────────────────────────

export default function FlyingHigh() {
  const { scene, sky, plane, moon, clouds } = useSceneControls();

  const {
    leftEngineMainFire,
    rightEngineMainFire,
    leftWingSecondaryFire,
    rightWingSecondaryFire,
    leftEngineSmokeTrail,
    rightEngineSmokeTrail,
  } = useMemo(() => {
    const splines = FLYING_HIGH_FIRE.splines ?? [];
    return {
      leftEngineMainFire: splines.find(
        (s) => s.name === 'Left Engine Main Fire'
      ),
      rightEngineMainFire: splines.find(
        (s) => s.name === 'Right Engine Main Fire'
      ),
      leftWingSecondaryFire: splines.find(
        (s) => s.name === 'Left Wing Secondary Fire'
      ),
      rightWingSecondaryFire: splines.find(
        (s) => s.name === 'Right Wing Secondary Fire'
      ),
      leftEngineSmokeTrail: splines.find(
        (s) => s.name === 'Left Engine Smoke Trail'
      ),
      rightEngineSmokeTrail: splines.find(
        (s) => s.name === 'Right Engine Smoke Trail'
      ),
    };
  }, []);
  const leftSmokePoints = useMemo(
    () =>
      getSplineWorldPoints(leftEngineSmokeTrail).map((pt) =>
        pt.position.clone()
      ),
    [leftEngineSmokeTrail]
  );
  const rightSmokePoints = useMemo(
    () =>
      getSplineWorldPoints(rightEngineSmokeTrail).map((pt) =>
        pt.position.clone()
      ),
    [rightEngineSmokeTrail]
  );

  return (
    <>
      <color attach="background" args={[scene.background]} />

      {/* Camera — three-quarter front view of the plane */}
      <PerspectiveCamera makeDefault position={[10, 3, 14]} fov={42} />
      <OrbitControls target={[0, 0.5, -1]} />

      {/* Lighting */}
      <ambientLight intensity={scene.ambientIntensity} />
      <directionalLight
        position={[5, 8, 10]}
        intensity={scene.directionalIntensity}
        color="#fff5e0"
      />
      <hemisphereLight
        skyColor={sky.color}
        groundColor="#443322"
        intensity={scene.hemisphereIntensity}
      />

      {/* Painted sky oval backdrop */}
      <SkyPanel sky={sky} />

      {moon.visible ? (
        <Moon
          position={moon.position}
          scale={moon.scale}
          color={moon.color}
          emissive={moon.emissive}
          emissiveIntensity={moon.emissiveIntensity}
          metalness={moon.metalness}
          roughness={moon.roughness}
        />
      ) : null}

      {/* Drei clouds for depth */}
      <SceneClouds clouds={clouds} />

      {/* Boeing 737 — angled slightly toward camera */}
      <Boeing737
        scale={plane.scale}
        rotation={plane.rotation}
        position={plane.position}
      />

      {/* Engine fire, smoke & glow lights */}
      <EngineFire
        leftEngineMainFire={leftEngineMainFire}
        rightEngineMainFire={rightEngineMainFire}
        leftWingSecondaryFire={leftWingSecondaryFire}
        rightWingSecondaryFire={rightWingSecondaryFire}
        leftEngineSmokeTrail={leftEngineSmokeTrail}
        rightEngineSmokeTrail={rightEngineSmokeTrail}
        leftSmokePoints={leftSmokePoints}
        rightSmokePoints={rightSmokePoints}
      />

      {/* Bloom for fire glow */}
      <EffectComposer disableNormalPass>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.45}
        />
      </EffectComposer>
    </>
  );
}
