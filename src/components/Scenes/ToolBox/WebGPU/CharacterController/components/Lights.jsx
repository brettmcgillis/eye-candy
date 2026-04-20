import React from 'react';

export default function Lights({ mode = 'Day' }) {
  const isNight = mode === 'Night';
  const ambientIntensity = isNight ? 0.2 : 2;
  const spotIntensity = isNight ? 0.8 : 4;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <spotLight
        position={[8, 6, 6]}
        intensity={spotIntensity}
        angle={Math.PI * 0.3}
        decay={0}
        target-position={[0, 0, 0]}
      />

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
