import React, { useEffect, useRef } from 'react';

import * as THREE from 'three';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import EarthGlobe from './components/EarthGlobe';
import Ghost from './components/Ghost';
import Location from './components/Location';
import StarDome from './components/StarDome';
import { GHOST_KEYS } from './components/getGhostControls';
import { EARTH_KEYS, STAR_KEYS } from './components/getSpaceControls';
import usePick from './hooks/usePick';
import useSceneControls from './hooks/useSceneControls';

const FOG_OFF = 1e7;

function createAnchor() {
  return { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
}

export default function AllMyFriendsAreGhosts() {
  const config = useSceneControls();
  const anchorRef = useRef(null);
  if (!anchorRef.current) anchorRef.current = createAnchor();

  const ghost = usePick(config, GHOST_KEYS);
  const stars = usePick(config, STAR_KEYS);
  const earth = usePick(config, EARTH_KEYS);

  useEffect(() => {
    anchorRef.current.position.set(0, 0, 0);
    anchorRef.current.quaternion.identity();
  }, [config.location]);

  useSceneBackdrop({
    color: config.backdropColor,
    fogFar: config.fogEnabled ? config.fogFar : FOG_OFF + 1,
    fogNear: config.fogEnabled ? config.fogNear : FOG_OFF,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />

      {stars.starsVisible && (
        <StarDome
          brightness={stars.starsBrightness}
          rotation={stars.starsRotation}
          tint={stars.starsTint}
          variant={stars.starsVariant}
        />
      )}
      {earth.earthVisible && (
        <EarthGlobe
          angularSize={earth.earthSize}
          atmosphereColor={earth.earthAtmosphere}
          azimuth={earth.earthAzimuth}
          elevation={earth.earthElevation}
          spin={earth.earthSpin}
        />
      )}

      <Location anchorRef={anchorRef} config={config} />
      <Ghost anchorRef={anchorRef} config={ghost} />
    </>
  );
}
