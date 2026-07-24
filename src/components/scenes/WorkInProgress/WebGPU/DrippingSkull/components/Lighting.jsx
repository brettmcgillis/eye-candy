import React from 'react';

export default function Lighting({
  ambientIntensity,
  keyColor,
  keyIntensity,
  rimColor,
  rimIntensity,
}) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <spotLight
        angle={0.38}
        castShadow
        color={keyColor}
        intensity={keyIntensity}
        penumbra={0.65}
        position={[2.5, 4.2, 2.4]}
        shadow-bias={-0.0008}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        color={rimColor}
        intensity={rimIntensity}
        position={[-2.8, 3.4, -3.6]}
      />
    </>
  );
}
