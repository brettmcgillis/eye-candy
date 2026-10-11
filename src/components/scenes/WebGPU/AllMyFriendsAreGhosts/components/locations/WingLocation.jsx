import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import Boeing737 from '@elements/Boeing737/Boeing737';

import CloudDeck from './CloudDeck';
import PlaneSky from './PlaneSky';
import Rain from './Rain';
import StormFlash from './StormFlash';

// Measured from the GLB: wing top skin at x≈9 is y≈0.43, mid-chord z≈-4.6.
const PLANE_OFFSET = [-9, -0.43, 4.6];
const PIVOT = new THREE.Vector3(-9, 0.5, 2.6);
const WINGTIP = [14.3, 0.95, -6];

function wobble(t, a, b, c) {
  return (
    0.55 * Math.sin(t * a) +
    0.3 * Math.sin(t * b + 1.3) +
    0.15 * Math.sin(t * c + 2.9)
  );
}

function WingtipLight({ color, intensity }) {
  const strobeRef = useRef(null);
  const glowRef = useRef(null);

  useFrame(({ clock }) => {
    const phase = clock.elapsedTime % 1.6;
    const on = phase < 0.06 || (phase > 0.18 && phase < 0.24) ? 1 : 0;
    if (strobeRef.current) strobeRef.current.intensity = on * intensity * 6;
    if (glowRef.current) glowRef.current.visible = on === 1;
  });

  return (
    <group position={WINGTIP}>
      <pointLight color={color} decay={2} distance={30} intensity={intensity} />
      <mesh>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight
        ref={strobeRef}
        color="#ffffff"
        decay={2}
        distance={40}
        intensity={0}
        position={[0.2, 0, -0.3]}
      />
      <mesh ref={glowRef} position={[0.2, 0, -0.3]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function WingLocation({
  anchorRef,
  backdropColor,
  config,
  sunAzimuth,
  sunElevation,
}) {
  const planeRef = useRef(null);
  const flashRef = useRef(0);
  const timeRef = useRef(0);
  const euler = useMemo(() => new THREE.Euler(), []);
  const pivotOffset = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const anchor = anchorRef.current;
    return () => {
      anchor.position.set(0, 0, 0);
      anchor.quaternion.identity();
    };
  }, [anchorRef]);

  useFrame((_, delta) => {
    timeRef.current += delta * config.wingTurbulenceSpeed;
    const t = timeRef.current;
    const amount = config.wingTurbulence;
    const anchor = anchorRef.current;
    euler.set(
      amount * 0.025 * wobble(t, 0.9, 2.3, 5.1),
      amount * 0.01 * wobble(t, 0.4, 1.1, 3.7),
      amount * 0.05 * wobble(t, 0.7, 1.9, 4.3)
    );
    anchor.quaternion.setFromEuler(euler);
    pivotOffset.copy(PIVOT).negate().applyQuaternion(anchor.quaternion);
    anchor.position
      .copy(PIVOT)
      .add(pivotOffset)
      .setY(anchor.position.y + amount * 0.35 * wobble(t, 1.3, 3.1, 7.3));
    planeRef.current?.position.copy(anchor.position);
    planeRef.current?.quaternion.copy(anchor.quaternion);
  });

  return (
    <>
      <group ref={planeRef}>
        <group position={PLANE_OFFSET}>
          <Boeing737 />
          {config.wingLightsVisible && (
            <WingtipLight
              color={config.wingNavColor}
              intensity={config.wingNavIntensity}
            />
          )}
        </group>
      </group>

      {config.wingSkyVisible && (
        <PlaneSky
          mie={config.wingSkyMie}
          rayleigh={config.wingSkyRayleigh}
          sunAzimuth={sunAzimuth}
          sunElevation={sunElevation}
          turbidity={config.wingSkyTurbidity}
        />
      )}

      {config.wingCloudsVisible && (
        <CloudDeck
          airspeed={config.wingAirspeed}
          coverage={config.wingCloudCoverage}
          height={config.wingCloudHeight}
          horizonColor={config.wingCloudHorizonColor}
          litColor={config.wingCloudLitColor}
          shadeColor={config.wingCloudShadeColor}
          softness={config.wingCloudSoftness}
          sunAzimuth={sunAzimuth}
          sunElevation={sunElevation}
        />
      )}

      {config.wingStorm && (
        <>
          <Rain
            airspeed={config.wingAirspeed * 0.35}
            color={config.wingRainColor}
            count={config.wingRainCount}
            fall={9}
            flashRef={flashRef}
            length={config.wingRainLength}
            opacity={config.wingRainOpacity}
          />
          <StormFlash
            backdropColor={backdropColor}
            color={config.wingFlashColor}
            flashRef={flashRef}
            intensity={config.wingFlashIntensity}
            maxGap={config.wingFlashMaxGap}
            minGap={config.wingFlashMinGap}
          />
        </>
      )}
    </>
  );
}

export default memo(WingLocation);
