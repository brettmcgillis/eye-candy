import React, { useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import GroundPlane from './components/GroundPlane';
import Lighting from './components/Lighting';
import ProjectorVolume from './components/ProjectorVolume';
import SceneFemur from './components/SceneFemur';
import ScenePostEffects from './components/ScenePostEffects';
import SceneSkull from './components/SceneSkull';
import StainedGlassProjector from './components/StainedGlassProjector';
import useResponsiveCamera from './hooks/useResponsiveCamera';
import useSceneControls from './hooks/useSceneControls';

const SKULL_SCALE = 0.1;
const FEMUR_SCALE = 0.75;
const BACKGROUND_COLOR = '#120d0b';
const FLOOR_FILL_LIGHT_LAYER = 7;
const PROJECTOR_VOLUME_LAYER = 10;

export default function BeautysInTheEyeOfTheBeheaded() {
  const { controls } = useSceneControls();
  const [projectorVolumeMaterial, setProjectorVolumeMaterial] = useState(null);
  const { cameraFov, cameraPosition, cameraTarget } = useResponsiveCamera({
    desktopFov: controls.desktopCameraFov,
    desktopPosition: controls.desktopCameraPosition,
    desktopTarget: controls.desktopCameraTarget,
    mobileFov: controls.mobileCameraFov,
    mobilePosition: controls.mobileCameraPosition,
    mobileTarget: controls.mobileCameraTarget,
  });

  return (
    <>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <fog attach="fog" args={[BACKGROUND_COLOR, 4, 14]} />

      <PerspectiveCamera
        makeDefault
        fov={cameraFov}
        position={cameraPosition}
        onUpdate={(camera) => {
          camera.layers.enable(FLOOR_FILL_LIGHT_LAYER);
          camera.lookAt(...cameraTarget);
        }}
      />
      <OrbitControls
        makeDefault
        enableDamping
        enableZoom
        enablePan
        autoRotate
        autoRotateSpeed={1}
        maxDistance={10}
        minDistance={2.5}
        target={cameraTarget}
      />

      <Lighting
        controls={controls}
        floorFillLightLayer={FLOOR_FILL_LIGHT_LAYER}
      />

      <StainedGlassProjector
        angle={controls.projectorAngle}
        blur={controls.projectorBlur}
        causticAmount={controls.projectorCausticAmount}
        causticContrast={controls.projectorCausticContrast}
        causticScale={controls.projectorCausticScale}
        causticSpeed={controls.projectorCausticSpeed}
        castShadow={controls.projectorCastShadow}
        color={controls.projectorColor}
        debug={controls.projectorDebug}
        decay={controls.projectorDecay}
        distance={controls.projectorDistance}
        extraLayers={
          controls.projectorVolumeEnabled ? [PROJECTOR_VOLUME_LAYER] : []
        }
        focus={controls.projectorFocus}
        intensity={controls.projectorIntensity}
        penumbra={controls.projectorPenumbra}
        position={controls.projectorPosition}
        repeat={controls.projectorRepeat}
        target={controls.projectorTarget}
        tintColor={controls.projectorTintColor}
        tintStrength={controls.projectorTintStrength}
      />

      {controls.projectorVolumeEnabled && (
        <ProjectorVolume
          angle={controls.projectorAngle}
          density={controls.projectorVolumeDensity}
          distance={controls.projectorDistance}
          layer={PROJECTOR_VOLUME_LAYER}
          onMaterialChange={setProjectorVolumeMaterial}
          position={controls.projectorPosition}
          steps={controls.projectorVolumeSteps}
          target={controls.projectorTarget}
        />
      )}

      <GroundPlane extraLightLayer={FLOOR_FILL_LIGHT_LAYER} />

      <SceneFemur
        position={controls.leftFemurPosition}
        rotation={controls.leftFemurRotation}
        scale={FEMUR_SCALE}
      />
      <SceneFemur
        position={controls.rightFemurPosition}
        rotation={controls.rightFemurRotation}
        scale={FEMUR_SCALE}
      />
      <SceneSkull
        position={controls.skullPosition}
        rotation={controls.skullRotation}
        scale={SKULL_SCALE}
      />

      <ScenePostEffects
        bloomDownSampleRatio={controls.bloomDownSampleRatio}
        bloomEnabled={controls.bloomEnabled}
        bloomRadius={controls.bloomRadius}
        bloomStrength={controls.bloomStrength}
        bloomThreshold={controls.bloomThreshold}
        projectorVolumeBlur={controls.projectorVolumeBlur}
        projectorVolumeEnabled={controls.projectorVolumeEnabled}
        projectorVolumeIntensity={controls.projectorVolumeIntensity}
        projectorVolumeLayer={PROJECTOR_VOLUME_LAYER}
        projectorVolumeMaterial={projectorVolumeMaterial}
        projectorVolumeResolutionScale={controls.projectorVolumeResolutionScale}
      />
    </>
  );
}
