import React from 'react';

import { Environment } from '@react-three/drei';

import { CameraRig } from '../../../../../modules/cameraRig';
import ManholeCover from '../../../../elements/ManholeCover/ManholeCover';
import ParkTrashCan from '../../../../elements/ParkTrashCan/ParkTrashCan';
import Sidewalks from '../../../../elements/Sidewalks/Sidewalks';
import CigaretteButts from '../../../../elements/cigaretteButts/CigaretteButts';
import { Litter, Litter2 } from '../../../../elements/litter/Litter';
import { NewsPaper2 } from '../../../../elements/newsPapers/NewsPapers';
import BirdPovRig from './components/BirdPovRig';
import BusStop from './components/BusStop';
import CursorTracker from './components/CursorTracker';
import FakeBird from './components/FakeBird';
import Nest from './components/Nest';
import SurveillancePost from './components/SurveillancePost';
import WetGround from './components/WetGround';
import useLensRegistry from './hooks/useLensRegistry';
import usePovDirector from './hooks/usePovDirector';
import useSceneBackground from './hooks/useSceneBackground';
import useSceneControls from './hooks/useSceneControls';
import v3 from './utils/vec';

export default function BirdsArentReal() {
  const config = useSceneControls();

  // Background is owned in one place (env map vs. flat sky) to avoid a toggle race;
  // <Environment> below does IBL only.
  useSceneBackground(config.envBackground, config.skyColor);

  const isPov = config.viewMode === 'pov';
  const isCursor = config.viewMode === 'cursor';

  // Per-bird lens-node registry (for Bird POV) + the shared cursor-stare point.
  const birdKeys = config.birds.map((b) => b.key).join(',');
  const { nodesRef, cursorTargetRef, callbacks } = useLensRegistry(birdKeys);

  // CCTV director: auto-cut between birds' feeds while in Bird POV mode.
  const { activeKey, activeCamId } = usePovDirector({
    enabled: isPov,
    birds: config.birds,
    shotDuration: config.povShotDuration,
  });

  return (
    <>
      {isPov ? (
        <BirdPovRig
          nodesRef={nodesRef}
          activeKey={activeKey}
          fov={config.povFov}
          dolly={config.povDolly}
        />
      ) : (
        // Key on the active preset so the rig remounts and OrbitControls re-syncs to
        // the preset's orbit frame. Without this, OrbitControls (makeDefault) already
        // owns the camera on first apply and the new frame doesn't take until "reset".
        // Stable during mouse-orbit/slider tuning (preset unchanged) so no churn.
        <CameraRig
          key={config.preset}
          camera={config.camera}
          apiRef={config.cameraApiRef}
        />
      )}
      <CursorTracker enabled={isCursor} targetRef={cursorTargetRef} />

      <fog
        attach="fog"
        args={[config.fogColor, config.fogNear, config.fogFar]}
      />

      {/* City lighting + reflections (IBL only). The visible backdrop is set by
          useSceneBackground, not by Environment, to avoid a toggle race. */}
      <Environment preset="city" environmentIntensity={config.envIntensity} />

      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      <directionalLight
        position={[8, 14, 6]}
        intensity={config.sunIntensity}
        color={config.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      {/* Always mounted; visibility toggled by prop. Mounting/unmounting the planar
          reflector on a preset switch stalls the WebGPU backend, so don't. */}
      <WetGround
        visible={config.showGround}
        size={config.groundSize}
        asphaltColor={config.asphaltColor}
        puddleColor={config.puddleColor}
        puddleScale={config.puddleScale}
        puddleAmount={config.puddleAmount}
        texScale={config.texScale}
        reflectStrength={config.reflectStrength}
        reflectTint={config.reflectTint}
        rippleScale={6}
        rippleStrength={0}
        rippleSpeed={0}
        roughDry={config.roughDry}
        roughWet={config.roughWet}
      />

      {config.showStreet && (
        <>
          {/* Assembled sidewalk block (4 curb slabs + edges + corners/ramps). */}
          <Sidewalks position={[0, 0, 0]} scale={config.curbScale} />
          {/* Bus stop shelter (with glitching ad faces) on top of the curb slab. */}
          <BusStop
            position={v3(config.busStopPos)}
            rotation={[0, config.busStopRotY, 0]}
            scale={config.busStopScale}
            artScaleX={config.adArtScaleX}
            artScaleY={config.adArtScaleY}
            artOffsetX={config.adArtOffsetX}
            artOffsetY={config.adArtOffsetY}
            artBg={config.adArtBg}
            glitchTile={config.adGlitchTile}
            glitchWidth={config.adGlitchWidth}
            glitchHeight={config.adGlitchHeight}
            glitchMinGap={config.adGlitchMinGap}
            glitchMaxGap={config.adGlitchMaxGap}
            glitchDuration={config.adGlitchDuration}
            glitchStutter={config.adGlitchStutter}
          />
          {/* Park trash can beside the bus stop. */}
          <ParkTrashCan
            position={v3(config.trashPos)}
            rotation={[0, config.trashRotY, 0]}
            scale={config.trashScale}
          />
          {/* Manhole cover on the asphalt in front of the curb. */}
          <ManholeCover
            position={v3(config.manholePos)}
            rotation={[0, config.manholeRotY, 0]}
            scale={config.manholeScale}
          />
          {/* Pigeon nest (sticks + 2 QR-stamped fake eggs) inside the bus shelter. */}
          <Nest
            position={v3(config.nestPos)}
            rotation={[0, config.nestRotY, 0]}
            scale={config.nestScale}
            eggScale={config.nestEggScale}
            egg1Pos={config.nestEgg1Pos}
            egg1Rot={config.nestEgg1Rot}
            egg2Pos={config.nestEgg2Pos}
            egg2Rot={config.nestEgg2Rot}
            qrShow={config.eggQrShow}
            qrScale={config.eggQrScale}
            qrU={config.eggQrU}
            qrV={config.eggQrV}
            qrSpin={config.eggQrSpin}
          />
          {/* Street litter scattered on the asphalt. */}
          <NewsPaper2
            position={v3(config.newspaper2Pos)}
            rotation={[0, config.newspaper2RotY, 0]}
            scale={config.newspaper2Scale}
          />
          <CigaretteButts
            position={v3(config.cigButtsPos)}
            rotation={[0, config.cigButtsRotY, 0]}
            scale={config.cigButtsScale}
          />
          <Litter
            position={v3(config.litter1Pos)}
            rotation={[0, config.litter1RotY, 0]}
            scale={config.litter1Scale}
          />
          <Litter2
            position={v3(config.litter2Pos)}
            rotation={[0, config.litter2RotY, 0]}
            scale={config.litter2Scale}
          />
        </>
      )}

      {config.birds
        .filter((b) => b.show)
        .map((b) => (
          <FakeBird
            key={b.key}
            species={config.birdType}
            behavior={config.behavior}
            animate={b.animate ?? config.animate}
            position={b.position}
            rotation={b.rotation}
            phase={b.phase}
            sweepRange={b.still ? 0 : config.sweepRange}
            sweepSpeed={b.still ? 0 : config.sweepSpeed}
            ledBlink={config.ledBlink}
            camScale={config.camScale}
            camRot={config.camRot}
            camOffset={config.camOffset}
            ledOffset={config.ledOffset}
            hidden={isPov && b.key === activeKey}
            aimAtCursor={isCursor && !b.still}
            cursorTargetRef={cursorTargetRef}
            lensRef={callbacks[b.key]}
          />
        ))}

      <SurveillancePost
        bloomEnabled={config.bloomEnabled}
        bloomThreshold={config.bloomThreshold}
        bloomStrength={config.bloomStrength}
        bloomRadius={config.bloomRadius}
        overlayEnabled={isPov}
        hudOpacity={config.hudOpacity}
        scanlineIntensity={config.scanlineIntensity}
        vignetteIntensity={config.vignetteIntensity}
        chromaticStrength={config.chromaticStrength}
        cameraLabel={activeCamId}
      />
    </>
  );
}
