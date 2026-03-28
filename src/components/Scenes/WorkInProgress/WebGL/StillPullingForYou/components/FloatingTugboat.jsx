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

const _baseQuat = new THREE.Quaternion();
const _waveQuat = new THREE.Quaternion();

function FloatingTugboat({
  position,
  rotation,
  scale,
  floatDraft,
  waveHeight,
  waveChoppiness,
  waveSpeed,
  lightConfig,
}) {
  const waveRef = useRef();

  useFrame(() => {
    const g = waveRef.current;
    if (!g) return;

    const x = position[0];
    const z = position[2];

    // Wave drives only the Y offset
    const waveY = sampleWaveHeight(x, z, waveHeight, waveChoppiness, waveSpeed);
    g.position.y = waveY + floatDraft;

    // Combine base orientation with wave tilt
    const n = sampleWaveNormal(x, z, waveHeight, waveChoppiness, waveSpeed);
    _normalVec.set(n.x, n.y, n.z).normalize();
    _waveQuat.setFromUnitVectors(_up, _normalVec);

    _baseQuat.setFromEuler(
      new THREE.Euler(rotation[0], rotation[1], rotation[2])
    );
    _qTarget.copy(_waveQuat).multiply(_baseQuat);

    _qCurrent.copy(g.quaternion);
    _qCurrent.slerp(_qTarget, 0.1);
    g.quaternion.copy(_qCurrent);
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <group ref={waveRef} scale={scale}>
        <TugBoat />
        <BoatLights {...lightConfig} />
      </group>
    </group>
  );
}

export default React.memo(FloatingTugboat);
