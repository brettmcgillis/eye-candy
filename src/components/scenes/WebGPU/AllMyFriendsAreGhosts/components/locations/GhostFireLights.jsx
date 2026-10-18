import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import {
  COALS_CENTER,
  FIRE_LIGHT_COLOUR,
  LOG_COUNT,
  coalsTerm,
  fireLifeAt,
  groundAndSky,
  logLight,
  sphereVisibility,
} from '../../utils/campfire/fireLighting';

const LOG_INDICES = Array.from({ length: LOG_COUNT }, (_, i) => i);
const FIRE_PEAK = Math.max(
  FIRE_LIGHT_COLOUR.x,
  FIRE_LIGHT_COLOUR.y,
  FIRE_LIGHT_COLOUR.z
);
const FIRE_HUE = FIRE_LIGHT_COLOUR.clone().divideScalar(FIRE_PEAK);
const COALS_HUE = new THREE.Color(1, 0.075, 0.01);
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const MIRROR_X = new THREE.Vector3(-1, 1, 1);

// Point lights placed and scaled so a Lambert surface at the ghost's centre,
// facing each light, receives exactly the shader's diffuse fire term there.
function GhostFireLights({ burnRef, fireOffset, ghostCentre, strength }) {
  const logRefs = useRef([]);
  const coalsRef = useRef(null);
  const hemiRef = useRef(null);
  const scratch = useMemo(
    () => ({
      centre: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      light: { center: new THREE.Vector3(), radius: 0, strength: 0 },
      term: new THREE.Vector3(),
      world: new THREE.Vector3(),
    }),
    []
  );

  const toCampfire = (world, out) =>
    out.copy(world).sub(fireOffset).multiply(MIRROR_X);
  const toWorld = (campfire, out) =>
    out.copy(campfire).multiply(MIRROR_X).add(fireOffset);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const life = fireLifeAt({ ...burnRef.current, time });
    const pos = toCampfire(ghostCentre, scratch.centre);

    LOG_INDICES.forEach((i) => {
      const lightObject = logRefs.current[i];
      if (!lightObject) return;
      const light = logLight(i, time, life, pos, scratch.light);
      scratch.dir.subVectors(light.center, pos);
      const distance = scratch.dir.length();
      scratch.dir.divideScalar(distance);
      const visibility = sphereVisibility(
        pos,
        scratch.dir,
        1,
        light.center,
        light.radius
      );
      toWorld(light.center, lightObject.position);
      lightObject.intensity =
        Math.PI *
        distance *
        distance *
        visibility *
        light.strength *
        FIRE_PEAK *
        strength;
    });

    if (coalsRef.current) {
      scratch.dir.subVectors(COALS_CENTER, pos).setY(0).normalize();
      const glow = coalsTerm(pos, scratch.dir, 1, life, scratch.term).x;
      const distance = pos.distanceTo(COALS_CENTER);
      toWorld(COALS_CENTER, coalsRef.current.position);
      coalsRef.current.intensity =
        Math.PI * distance * distance * glow * strength;
    }

    if (hemiRef.current) {
      groundAndSky(pos, DOWN, 1, life, scratch.term);
      hemiRef.current.groundColor.setRGB(
        scratch.term.x * Math.PI * strength,
        scratch.term.y * Math.PI * strength,
        scratch.term.z * Math.PI * strength
      );
      groundAndSky(pos, UP, 1, life, scratch.term);
      hemiRef.current.color.setRGB(
        scratch.term.x * Math.PI * strength,
        scratch.term.y * Math.PI * strength,
        scratch.term.z * Math.PI * strength
      );
    }
  });

  return (
    <>
      {LOG_INDICES.map((i) => (
        <pointLight
          key={i}
          ref={(el) => {
            logRefs.current[i] = el;
          }}
          color={FIRE_HUE.toArray()}
          decay={2}
          distance={0}
          intensity={0}
        />
      ))}
      <pointLight
        ref={coalsRef}
        color={COALS_HUE}
        decay={2}
        distance={0}
        intensity={0}
      />
      <hemisphereLight ref={hemiRef} intensity={1} />
    </>
  );
}

export default memo(GhostFireLights);
