import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Bloom from '../../../../postprocessing/webGPU/bloom/Bloom';
import CameraRig from '../../../../rigging/CameraRig';
import PosedRaccoon from './components/PosedRaccoon';
import Streetlight from './components/Streetlight';
import TrashScene from './components/TrashScene';
import WetGround from './components/WetGround';
import useSceneControls from './hooks/useSceneControls';

// The sodium-vapor lamp inside the streetlight head, with a subtle flicker.
const LampLight = React.memo(function LampLight({
  position,
  color,
  intensity,
  distance,
  decay,
  flicker,
}) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const noise =
      Math.sin(t * 13.1) * 0.5 +
      Math.sin(t * 27.7 + 1.7) * 0.3 +
      Math.sin(t * 6.3 + 3.1) * 0.2;
    ref.current.intensity = intensity * (1 + noise * flicker);
  });
  return (
    <pointLight
      ref={ref}
      position={position}
      color={color}
      intensity={intensity}
      distance={distance}
      decay={decay}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0015}
    />
  );
});

export default function UrbanWildlife() {
  const config = useSceneControls();

  const gunTransform = useMemo(
    () => ({
      scale: config.gunScale,
      posX: config.gunPosX,
      posY: config.gunPosY,
      posZ: config.gunPosZ,
      rotX: config.gunRotX,
      rotY: config.gunRotY,
      rotZ: config.gunRotZ,
    }),
    [
      config.gunScale,
      config.gunPosX,
      config.gunPosY,
      config.gunPosZ,
      config.gunRotX,
      config.gunRotY,
      config.gunRotZ,
    ]
  );

  const raccoons = useMemo(
    () =>
      [1, 2, 3].map((i) => ({
        key: i,
        pose: config[`r${i}Pose`],
        position: [config[`r${i}X`], 0, config[`r${i}Z`]],
        rotationY: config[`r${i}RotY`],
        scale: config[`r${i}Scale`],
        holdsGun: config[`r${i}HoldsGun`],
        gunHand: config[`r${i}GunHand`],
      })),
    [config]
  );

  return (
    <>
      <CameraRig camera={config.camera} />

      <color attach="background" args={[config.bgColor]} />
      <fog
        attach="fog"
        args={[config.fogColor, config.fogNear, config.fogFar]}
      />

      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      {/* Cool moonlight fill from above-left */}
      <directionalLight
        position={[-6, 8, -4]}
        intensity={config.moonIntensity}
        color={config.moonColor}
      />
      <LampLight
        position={[config.streetlightX, config.lampHeight, config.streetlightZ]}
        color={config.lampColor}
        intensity={config.lampIntensity}
        distance={config.lampDistance}
        decay={config.lampDecay}
        flicker={config.lampFlicker}
      />

      <WetGround
        asphaltColor={config.asphaltColor}
        puddleColor={config.puddleColor}
        puddleScale={config.puddleScale}
        puddleAmount={config.puddleAmount}
        texScale={config.texScale}
        reflectStrength={config.reflectStrength}
        reflectTint={config.reflectTint}
        rippleScale={config.rippleScale}
        rippleStrength={config.rippleStrength}
        rippleSpeed={config.rippleSpeed}
        roughDry={config.roughDry}
        roughWet={config.roughWet}
      />

      <Streetlight
        position={[config.streetlightX, 0, config.streetlightZ]}
        scale={config.streetlightScale}
        glassColor={config.glassColor}
        glassEmissive={config.glassEmissive}
        showBase={config.showBase}
      />

      {config.showTrash && <TrashScene />}

      {raccoons.map((r) => (
        <group
          key={r.key}
          position={r.position}
          rotation={[0, r.rotationY, 0]}
          scale={r.scale}
        >
          <PosedRaccoon
            pose={r.pose}
            animate={config.animatePoses}
            holdsGun={r.holdsGun}
            gunHand={r.gunHand}
            gunTransform={gunTransform}
          />
        </group>
      ))}

      {config.bloomEnabled && (
        <Bloom
          threshold={config.bloomThreshold}
          strength={config.bloomStrength}
          radius={config.bloomRadius}
        />
      )}
    </>
  );
}
