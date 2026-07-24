import * as THREE from 'three/webgpu';

import React, { memo, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { textureFile } from '../../../../../../utils/appUtils';
import Moon from '../../../../../elements/moon/Moon';

const SKY_RADIUS = 900;

useTexture.preload(textureFile('blackhole/legacy-milkyway.jpg'));

// Night sky: a starfield dome and a small emissive moon, both riding along
// with the ghost so the horizon never gets closer, plus the scene's
// atmosphere lights (dim blue ambient + a cool directional "moonlight"
// aimed from the moon's sky position).
function SkyRig({ config, tracker }) {
  const groupRef = useRef(null);
  const starTexture = useTexture(textureFile('blackhole/legacy-milkyway.jpg'));

  useMemo(() => {
    starTexture.colorSpace = THREE.SRGBColorSpace;
    starTexture.wrapS = THREE.RepeatWrapping;
    starTexture.wrapT = THREE.RepeatWrapping;
    starTexture.repeat.set(config.skyTextureRepeat, config.skyTextureRepeat);
  }, [config.skyTextureRepeat, starTexture]);

  const moonPosition = useMemo(() => {
    const azimuth = (config.moonAzimuth * Math.PI) / 180;
    const elevation = (config.moonElevation * Math.PI) / 180;
    const r = SKY_RADIUS * 0.85;
    return [
      Math.sin(azimuth) * Math.cos(elevation) * r,
      Math.sin(elevation) * r,
      Math.cos(azimuth) * Math.cos(elevation) * r,
    ];
  }, [config.moonAzimuth, config.moonElevation]);

  // Moonlight direction only needs the same bearing as the visual moon —
  // parked much closer so the directional light's default target keeps a
  // sane vector.
  const lightPosition = useMemo(
    () => moonPosition.map((v) => v * 0.1),
    [moonPosition]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.set(tracker.position.x, 0, tracker.position.z);
  });

  return (
    <>
      <group ref={groupRef}>
        <mesh renderOrder={-100}>
          <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
          <meshBasicMaterial
            color={config.skyTint}
            depthWrite={false}
            fog={false}
            map={starTexture}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>

        <Moon
          emissive={config.moonColor}
          emissiveIntensity={config.moonEmissiveIntensity}
          emissiveUsesTexture
          fog={false}
          position={moonPosition}
          radius={config.moonSize}
          segments={32}
        />
      </group>

      {/* Outside the player-following group: with the default target at the
          world origin, a fixed position keeps the moonlight direction
          constant no matter where the ghost wanders. */}
      <directionalLight
        color={config.moonLightColor}
        intensity={config.moonLightIntensity}
        position={lightPosition}
      />

      <ambientLight
        color={config.ambientColor}
        intensity={config.ambientIntensity}
      />
      <hemisphereLight
        color={config.skyGlowColor}
        groundColor={config.groundGlowColor}
        intensity={config.hemisphereIntensity}
      />
    </>
  );
}

export default memo(SkyRig);
