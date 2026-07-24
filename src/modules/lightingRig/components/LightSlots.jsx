import * as THREE from 'three';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useHelper } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { radians } from '../../../utils/math';
import ensureRectAreaLightSupport from './rectAreaLtc';
import useLightSlot from './useLightSlot';

function useLightTarget(lightRef, target) {
  const targetRef = useRef(null);

  useEffect(() => {
    const light = lightRef.current;
    const targetObject = targetRef.current;

    if (!light || !targetObject) {
      return;
    }

    light.target = targetObject;
    targetObject.updateMatrixWorld();
  }, [lightRef, target]);

  return targetRef;
}

const AmbientSlot = memo(function AmbientSlot({ slot, onLightChange }) {
  const lightRef = useLightSlot(slot, onLightChange);

  return (
    <ambientLight
      ref={lightRef}
      color={slot.color}
      intensity={slot.intensity}
    />
  );
});

const HemisphereSlot = memo(function HemisphereSlot({ slot, onLightChange }) {
  const lightRef = useLightSlot(slot, onLightChange);

  return (
    <hemisphereLight
      ref={lightRef}
      color={slot.skyColor}
      groundColor={slot.groundColor}
      intensity={slot.intensity}
    />
  );
});

const DirectionalSlot = memo(function DirectionalSlot({ slot, onLightChange }) {
  const lightRef = useLightSlot(slot, onLightChange);
  const targetRef = useLightTarget(lightRef, slot.target);

  useHelper(slot.debug ? lightRef : null, THREE.DirectionalLightHelper, 0.7);

  return (
    <>
      <directionalLight
        ref={lightRef}
        castShadow={!!slot.shadow}
        color={slot.color}
        intensity={slot.intensity}
        position={slot.position}
      />
      <object3D ref={targetRef} position={slot.target} />
    </>
  );
});

const PointSlot = memo(function PointSlot({ slot, onLightChange }) {
  const lightRef = useLightSlot(slot, onLightChange);

  useHelper(slot.debug ? lightRef : null, THREE.PointLightHelper, 0.3);

  return (
    <pointLight
      ref={lightRef}
      castShadow={!!slot.shadow}
      color={slot.color}
      decay={slot.decay}
      distance={slot.distance}
      intensity={slot.intensity}
      position={slot.position}
    />
  );
});

const SpotSlot = memo(function SpotSlot({ slot, onLightChange }) {
  const lightRef = useLightSlot(slot, onLightChange);
  const targetRef = useLightTarget(lightRef, slot.target);

  useHelper(slot.debug ? lightRef : null, THREE.SpotLightHelper);

  return (
    <>
      <spotLight
        ref={lightRef}
        angle={radians(slot.angle)}
        castShadow={!!slot.shadow}
        color={slot.color}
        decay={slot.decay}
        distance={slot.distance}
        intensity={slot.intensity}
        penumbra={slot.penumbra}
        position={slot.position}
      />
      <object3D ref={targetRef} position={slot.target} />
    </>
  );
});

const RectAreaSlot = memo(function RectAreaSlot({ slot, onLightChange }) {
  const { gl } = useThree();
  const lightRef = useLightSlot(slot, onLightChange);
  const [ltcReady, setLtcReady] = useState(false);

  useHelper(slot.debug ? lightRef : null, RectAreaLightHelper);

  useEffect(() => {
    let active = true;

    ensureRectAreaLightSupport(!!gl.isWebGPURenderer).then(() => {
      if (active) {
        setLtcReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [gl]);

  // Rendering before the LTC tables land gives an unlit light that reads as a
  // broken slot rather than a pending upload.
  if (!ltcReady) {
    return null;
  }

  return (
    <rectAreaLight
      ref={lightRef}
      color={slot.color}
      height={slot.height}
      intensity={slot.intensity}
      position={slot.position}
      rotation={slot.rotation}
      width={slot.width}
    />
  );
});

const SLOT_COMPONENTS = Object.freeze({
  ambient: AmbientSlot,
  directional: DirectionalSlot,
  hemisphere: HemisphereSlot,
  point: PointSlot,
  rectArea: RectAreaSlot,
  spot: SpotSlot,
});

export default SLOT_COMPONENTS;
