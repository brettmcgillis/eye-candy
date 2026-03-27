/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';

import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import TugBoat from '../../../../../elements/tugboat/TugBoat';
import {
  sampleWaveHeight,
  sampleWaveNormal,
} from '../../../../../elements/water/NurbsWaterColumn';
import BoatLights from './BoatLights';

// Reusable math objects (allocated once, reused every frame)
const _up = new THREE.Vector3(0, 1, 0);
const _normalVec = new THREE.Vector3();
const _qTarget = new THREE.Quaternion();
const _qCurrent = new THREE.Quaternion();

function FloatingTugboat({
  scale,
  floatDraft,
  waveHeight,
  waveChoppiness,
  waveSpeed,
}) {
  const groupRef = useRef();

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const x = 0;
    const z = 0;

    // sample wave surface
    const waveY = sampleWaveHeight(x, z, waveHeight, waveChoppiness, waveSpeed);
    g.position.y = waveY + floatDraft;

    // tilt to match wave normal
    const n = sampleWaveNormal(x, z, waveHeight, waveChoppiness, waveSpeed);
    _normalVec.set(n.x, n.y, n.z).normalize();
    _qTarget.setFromUnitVectors(_up, _normalVec);
    _qCurrent.copy(g.quaternion);
    _qCurrent.slerp(_qTarget, 0.1); // smooth follow
    g.quaternion.copy(_qCurrent);
  });

  return (
    <group ref={groupRef} scale={scale}>
      <TugBoat />
      <BoatLights />
    </group>
  );
}

export default React.memo(FloatingTugboat);
