import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { CameraRig } from '../../../../../modules/cameraRig';
import Bloom from '../../../../postprocessing/webGPU/bloom/Bloom';
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

  const knifeTransform = useMemo(
    () => ({
      scale: config.knifeScale,
      posX: config.knifePosX,
      posY: config.knifePosY,
      posZ: config.knifePosZ,
      rotX: config.knifeRotX,
      rotY: config.knifeRotY,
      rotZ: config.knifeRotZ,
    }),
    [
      config.knifeScale,
      config.knifePosX,
      config.knifePosY,
      config.knifePosZ,
      config.knifeRotX,
      config.knifeRotY,
      config.knifeRotZ,
    ]
  );

  const trashCans = useMemo(
    () =>
      [1, 2, 3, 4].reduce((acc, i) => {
        acc[`t${i}`] = {
          position: [
            config[`t${i}PosX`],
            config[`t${i}PosY`],
            config[`t${i}PosZ`],
          ],
          rotation: [
            config[`t${i}RotX`],
            config[`t${i}RotY`],
            config[`t${i}RotZ`],
          ],
        };
        return acc;
      }, {}),
    [config]
  );

  const raccoons = useMemo(
    () =>
      [1, 2, 3].map((i) => ({
        key: i,
        pose: config[`r${i}Pose`],
        position: [config[`r${i}X`], 0, config[`r${i}Z`]],
        rotationY: config[`r${i}RotY`],
        scale: config[`r${i}Scale`],
        weapon: config[`r${i}Weapon`],
        weaponHand: config[`r${i}WeaponHand`],
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
        intensity={config.lampIntensity + 100}
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

      {config.showTrash && <TrashScene cans={trashCans} />}

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
            weapon={r.weapon}
            weaponHand={r.weaponHand}
            gunTransform={gunTransform}
            knifeTransform={knifeTransform}
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
