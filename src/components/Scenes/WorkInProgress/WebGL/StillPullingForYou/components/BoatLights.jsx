import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// headlightMode / cabinMode:
//   'static'   – no animation, use intensity props as-is
//   'shorting'  – mostly ON, brief random flickers off  (sinking boat)
//   'dying'     – mostly OFF, brief random flickers on  (sunk boat)

function BoatLights({
  lightDebug = false,
  headlightVisible = true,
  headlightX = 0,
  headlightY = 0.6,
  headlightZ = -5,
  headlightIntensity = 2,
  headlightDistance = 8,
  headlightColor = '#ffe8b0',
  headlightMode = 'static',
  cabinVisible = true,
  cabinX = 0,
  cabinY = 1.2,
  cabinZ = 1,
  cabinIntensity = 1.5,
  cabinDistance = 5,
  cabinColor = '#ffd080',
  cabinMode = 'static',
}) {
  const headlightRef = useRef();
  const cabinRef = useRef();
  const headState = useRef({ nextChange: 0, on: true });
  const cabinState = useRef({ nextChange: 0, on: true });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Headlight flicker
    if (headlightRef.current && headlightMode !== 'static') {
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
      headlightRef.current.intensity = s.on ? headlightIntensity : 0;
    }

    // Cabin flicker (offset timings so the two lights don't sync)
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
    }
  });

  return (
    <>
      {headlightVisible && (
        <pointLight
          ref={headlightRef}
          position={[headlightX, headlightY, headlightZ]}
          intensity={headlightIntensity}
          distance={headlightDistance}
          decay={2}
          color={headlightColor}
        />
      )}
      {lightDebug && (
        <mesh position={[headlightX, headlightY, headlightZ]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial color={headlightColor} wireframe />
        </mesh>
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
