import React, { memo } from 'react';

function SpotLighting({
  keyLightRef,
  godraysLightRef,
  ambientIntensity,
  keyIntensity,
  keyColor,
  rimIntensity,
  rimColor,
  fillIntensity,
  fillColor,
}) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />

      {/* Key — warm overhead-front spot */}
      <spotLight
        ref={keyLightRef}
        position={[2, 5, 3]}
        target-position={[0, 1, 0]}
        intensity={keyIntensity}
        angle={0.35}
        penumbra={0.6}
        color={keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />

      {/* Rim — cool blue from behind */}
      <spotLight
        position={[-1.5, 3.5, -4]}
        target-position={[0, 1, 0]}
        intensity={rimIntensity}
        angle={0.5}
        penumbra={0.8}
        color={rimColor}
      />

      {/* Fill — soft green-gold from side to catch the verdigris */}
      <directionalLight
        position={[-3, 2, 1]}
        intensity={fillIntensity}
        color={fillColor}
      />

      {/* Godray source — behind and above the horse so shadow falls toward camera */}
      <pointLight
        ref={godraysLightRef}
        position={[0, 5, -5]}
        intensity={1000}
        color={keyColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
    </>
  );
}

export default memo(SpotLighting);
