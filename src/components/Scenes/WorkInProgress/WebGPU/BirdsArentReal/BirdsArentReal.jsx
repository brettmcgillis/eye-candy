import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Environment, useEnvironment, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { imageFile, videoFile } from '../../../../../utils/appUtils';
import BusStop from '../../../../elements/Busstop/Busstop';
import ManholeCover from '../../../../elements/ManholeCover/ManholeCover';
import Nest from '../../../../elements/Nest/Nest';
import ParkTrashCan from '../../../../elements/ParkTrashCan/ParkTrashCan';
import Sidewalks from '../../../../elements/Sidewalks/Sidewalks';
import CigaretteButts from '../../../../elements/cigaretteButts/CigaretteButts';
import { Litter, Litter2 } from '../../../../elements/litter/Litter';
import { NewsPaper2 } from '../../../../elements/newsPapers/NewsPapers';
import CRTAdGlitchMaterial from '../../../../materials/webGPU/crt/crtAdGlitchMaterial';
import CameraRig from '../../../../rigging/CameraRig';
import BirdPovRig from './components/BirdPovRig';
import CursorTracker from './components/CursorTracker';
import FakeBird from './components/FakeBird';
import SurveillancePost from './components/SurveillancePost';
import WetGround from './components/WetGround';
import useSceneControls from './hooks/useSceneControls';

const v3 = (o) => [o.x, o.y, o.z];

// Shared art playlist — every ad face cycles through all of it (videos + the
// Aisle9 logo stills), so given enough time each panel shows every piece.
const AD_ART = [
  { type: 'video', src: videoFile('watercolor.mp4') },
  { type: 'video', src: videoFile('bluejays.mp4') },
  { type: 'video', src: videoFile('electronMicroscopy.mp4') },
  { type: 'video', src: videoFile('enlightened.mp4') },
  { type: 'video', src: videoFile('extinguished.mp4') },
  { type: 'image', src: imageFile('aisle9/Aisle9Logo-NowHiring.png') },
  { type: 'image', src: imageFile('aisle9/Aisle9Logo-ApplyNow.png') },
  { type: 'image', src: imageFile('TagFaded.png') },
  { type: 'image', src: imageFile('DrippingSquares.png') },
];

// Per overridable ad face (the InsideBack map is left alone): where it starts in
// the cycle so the three panels stay out of sync. flipX/flipY correct mirrored
// atlas UVs (toggle if a face reads backwards or upside-down).
const AD_FACES = {
  BusStop_Sign_InsideRight: { startOffset: 0 },
  BusStop_Sign_OutsideBack: { startOffset: 2 },
  BusStop_Sign_OutsideRight: { startOffset: 4 },
};

// QR sticker stamped on the nest eggs — sells the "mass-produced fake" gag. Unlit
// decal map; sRGB so the black/white code stays crisp.
const QR_TEXTURE = imageFile(
  'brettmcgillis-github-io-eyecandy-dumpsterFire-brickWall-qr.png'
);

export default function BirdsArentReal() {
  const config = useSceneControls();

  const qrMap = useTexture(QR_TEXTURE);
  qrMap.colorSpace = THREE.SRGBColorSpace;
  qrMap.wrapS = THREE.ClampToEdgeWrapping;
  qrMap.wrapT = THREE.ClampToEdgeWrapping;

  // Own scene.background in ONE place. Letting drei <Environment background> manage it
  // AND a conditional <color attach="background"> fight over scene.background races on
  // toggle (black flash) and leaves the city skybox stuck visible after a few preset
  // switches. Here Environment only does IBL; this effect sets the background outright.
  const scene = useThree((s) => s.scene);
  const cityEnv = useEnvironment({ preset: 'city' });
  const bgColorRef = useRef(new THREE.Color());
  useEffect(() => {
    scene.background = config.envBackground
      ? cityEnv
      : bgColorRef.current.set(config.skyColor);
  }, [scene, cityEnv, config.envBackground, config.skyColor]);

  const isPov = config.viewMode === 'pov';
  const isCursor = config.viewMode === 'cursor';

  // Live registry of each bird's swept lens group (filled by FakeBird/CameraHead via
  // lensRef) + the world point the flock stares at in Cursor-Follow mode.
  const lensNodesRef = useRef(new Map());
  const cursorTargetRef = useRef(new THREE.Vector3());

  // Stable per-bird lens-register callbacks (keyed by bird key) so attaching a node
  // doesn't churn every render.
  const birdKeys = config.birds.map((b) => b.key).join(',');
  const lensCallbacks = useMemo(() => {
    const map = {};
    birdKeys
      .split(',')
      .filter(Boolean)
      .forEach((key) => {
        map[key] = (node) => {
          if (node) lensNodesRef.current.set(key, node);
          else lensNodesRef.current.delete(key);
        };
      });
    return map;
  }, [birdKeys]);

  // CCTV director: auto-cut between birds' feeds on a timer while in Bird POV mode.
  const [povIndex, setPovIndex] = useState(0);
  const birdCount = config.birds.length;
  useEffect(() => {
    if (!isPov || birdCount === 0) return undefined;
    const id = window.setInterval(
      () => setPovIndex((i) => (i + 1) % birdCount),
      Math.max(config.povShotDuration, 1) * 1000
    );
    return () => window.clearInterval(id);
  }, [isPov, birdCount, config.povShotDuration]);

  const activeBird = birdCount ? config.birds[povIndex % birdCount] : null;
  const activeKey = activeBird?.key ?? null;
  const activeCamId = activeBird?.camId ?? 'BIRD 0.0.0.0';

  // Build the ad material for an overridable face, fed by the live "Ads"
  // controls. `uvRect` (from Busstop) normalizes each face's atlas sub-rect.
  const renderAd = (name, uvRect) => {
    const face = AD_FACES[name];
    if (!face) return null;
    return (
      <CRTAdGlitchMaterial
        artSources={AD_ART}
        startOffset={face.startOffset}
        uvOrigin={uvRect.origin}
        uvSpan={uvRect.span}
        flipX={face.flipX}
        flipY={face.flipY}
        artScale={{ x: config.adArtScaleX, y: config.adArtScaleY }}
        artOffset={{ x: config.adArtOffsetX, y: config.adArtOffsetY }}
        artBg={config.adArtBg}
        textTile={config.adGlitchTile}
        textWidth={config.adGlitchWidth}
        textHeight={config.adGlitchHeight}
        artMinDur={config.adGlitchMinGap}
        artMaxDur={config.adGlitchMaxGap}
        glitchDuration={config.adGlitchDuration}
        glitchStutter={config.adGlitchStutter}
      />
    );
  };

  return (
    <>
      {isPov ? (
        <BirdPovRig
          nodesRef={lensNodesRef}
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

      {/* City lighting + reflections (IBL only). The visible backdrop is set by the
          scene.background effect above, not by Environment, to avoid a toggle race. */}
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
          {/* Bus stop shelter on top of the curb slab. */}
          <BusStop
            position={v3(config.busStopPos)}
            rotation={[0, config.busStopRotY, 0]}
            scale={config.busStopScale}
            renderAd={renderAd}
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
          {/* Pigeon nest (sticks + 2 eggs) inside the bus shelter. */}
          <Nest
            position={v3(config.nestPos)}
            rotation={[0, config.nestRotY, 0]}
            scale={config.nestScale}
            eggScale={config.nestEggScale}
            egg1Pos={config.nestEgg1Pos}
            egg1Rot={config.nestEgg1Rot}
            egg2Pos={config.nestEgg2Pos}
            egg2Rot={config.nestEgg2Rot}
            eggQrMap={config.eggQrShow ? qrMap : undefined}
            eggQrScale={config.eggQrScale}
            eggQrU={config.eggQrU}
            eggQrV={config.eggQrV}
            eggQrSpin={config.eggQrSpin}
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
            lensRef={lensCallbacks[b.key]}
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
