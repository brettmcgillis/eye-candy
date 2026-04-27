import React from 'react';

export default function Lights({ mode = 'Day' }) {
  const isNight = mode === 'Night';
  const ambientIntensity = isNight ? 0.25 : 1.6;
  const spotIntensity = 0.5;
  const followLightIntensity = isNight ? 0.8 : 3.5;
  const followLightColor = isNight ? '#b7c8ff' : '#ffffff';

  return (
    <>
      <directionalLight
        castShadow
        name="followLight"
        color={followLightColor}
        intensity={followLightIntensity}
        position={[20, 30, 10]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-normalBias={0.06}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-top={40}
        shadow-camera-right={40}
        shadow-camera-bottom={-40}
        shadow-camera-left={-40}
      />
      <ambientLight intensity={ambientIntensity} />
      {isNight && (
        <spotLight
          position={[8, 6, 6]}
          intensity={spotIntensity}
          angle={Math.PI * 0.45}
          decay={0}
          target-position={[0, 0, 0]}
        />
      )}

      {isNight && (
        <pointLight
          position={[-6, 3, -6]}
          color="#4488ff"
          intensity={0.3}
          decay={2}
          distance={15}
        />
      )}
    </>
  );
}
