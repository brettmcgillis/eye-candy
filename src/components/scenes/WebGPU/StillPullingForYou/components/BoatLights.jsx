/* eslint-disable no-param-reassign */
import React, { useCallback, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import BugSparkles from '@elements/BugSparkles';

const BLOOM_LAYER = 1;

function BoatLights({
  lightDebug = false,
  headlightVisible = true,
  headlightX = 0,
  headlightY = 0.6,
  headlightZ = -5,
  headlightIntensity = 2,
  headlightColor = '#ffe8b0',
  headlightMode = 'static',
  headlightMaterialRef,
  cabinVisible = true,
  cabinX = 0,
  cabinY = 1.2,
  cabinZ = 1,
  cabinIntensity = 1.5,
  cabinDistance = 5,
  cabinColor = '#ffd080',
  cabinMode = 'static',
  sparklesVisible = false,
  sparklesCount = 6,
  sparklesSize = 2,
  sparklesSpeed = 1.5,
  sparklesScale = 3,
  sparklesColor = '#ffedb1',
  sparklesIntensity = 3,
}) {
  const cabinRef = useRef();
  const headGlowRef = useRef();
  const cabinGlowRef = useRef();
  const headState = useRef({ nextChange: 0, on: true });
  const cabinState = useRef({ nextChange: 0, on: true });

  const setBloomLayer = useCallback((mesh) => {
    if (!mesh) return;
    mesh.layers.set(BLOOM_LAYER);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (headlightMode !== 'static') {
      const s = headState.current;
      if (t >= s.nextChange) {
        if (headlightMode === 'shorting') {
          if (s.on) {
            s.on = false;
            s.nextChange = t + 0.03 + Math.random() * 0.08;
          } else {
            s.on = true;
            s.nextChange = t + 0.5 + Math.random() * 2.5;
          }
        } else if (headlightMode === 'dying') {
          if (s.on) {
            s.on = false;
            s.nextChange = t + 1.0 + Math.random() * 3.0;
          } else {
            s.on = true;
            s.nextChange = t + 0.02 + Math.random() * 0.12;
          }
        }
      }
      if (headlightMaterialRef?.current) {
        headlightMaterialRef.current.emissiveIntensity = s.on
          ? headlightIntensity
          : 0;
      }
      if (headGlowRef.current) {
        headGlowRef.current.material.opacity = s.on ? 1 : 0;
      }
    }

    if (cabinRef.current && cabinMode !== 'static') {
      const s = cabinState.current;
      if (t >= s.nextChange) {
        if (cabinMode === 'shorting') {
          if (s.on) {
            s.on = false;
            s.nextChange = t + 0.04 + Math.random() * 0.1;
          } else {
            s.on = true;
            s.nextChange = t + 0.7 + Math.random() * 2.0;
          }
        } else if (cabinMode === 'dying') {
          if (s.on) {
            s.on = false;
            s.nextChange = t + 1.5 + Math.random() * 3.5;
          } else {
            s.on = true;
            s.nextChange = t + 0.03 + Math.random() * 0.15;
          }
        }
      }
      cabinRef.current.intensity = s.on ? cabinIntensity : 0;
      if (cabinGlowRef.current) {
        cabinGlowRef.current.material.opacity = s.on ? 1 : 0;
      }
    }
  });

  return (
    <>
      {headlightVisible && (
        <mesh
          ref={(m) => {
            headGlowRef.current = m;
            setBloomLayer(m);
          }}
          position={[headlightX, headlightY, headlightZ]}
        >
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial
            color={headlightColor}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
      {lightDebug && (
        <mesh position={[headlightX, headlightY, headlightZ]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial color={headlightColor} wireframe />
        </mesh>
      )}
      {headlightVisible && sparklesVisible && (
        <BugSparkles
          position={[headlightX, headlightY, headlightZ]}
          count={sparklesCount}
          color={sparklesColor}
          intensity={sparklesIntensity}
          size={sparklesSize}
          speed={sparklesSpeed}
          scale={sparklesScale}
        />
      )}
      {cabinVisible && (
        <pointLight
          ref={cabinRef}
          position={[cabinX, cabinY, cabinZ]}
          intensity={cabinIntensity}
          distance={cabinDistance}
          decay={2}
          color={cabinColor}
        />
      )}
      {cabinVisible && (
        <mesh
          ref={(m) => {
            cabinGlowRef.current = m;
            setBloomLayer(m);
          }}
          position={[cabinX, cabinY, cabinZ]}
        >
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshBasicMaterial
            color={cabinColor}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
      {lightDebug && (
        <mesh position={[cabinX, cabinY, cabinZ]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial color={cabinColor} wireframe />
        </mesh>
      )}
    </>
  );
}

export default React.memo(BoatLights);
