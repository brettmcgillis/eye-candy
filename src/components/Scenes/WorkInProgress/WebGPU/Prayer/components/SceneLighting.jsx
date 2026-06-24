import React, { memo } from 'react';

function SceneLighting({
  ambientColor,
  ambientIntensity,
  keyColor,
  keyIntensity,
  keyPosition,
  fillColor,
  fillIntensity,
  fillPosition,
  godraysColor,
  godraysIntensity,
  godraysPosition,
  godraysLightRef,
}) {
  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />

      <directionalLight
        castShadow
        color={keyColor}
        intensity={keyIntensity}
        position={keyPosition}
      />

      <pointLight
        color={fillColor}
        intensity={fillIntensity}
        position={fillPosition}
        distance={20}
        decay={2}
      />

      <pointLight
        ref={godraysLightRef}
        castShadow
        color={godraysColor}
        intensity={godraysIntensity}
        position={godraysPosition}
        distance={40}
        decay={1.8}
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.001}
        // shadow-camera-near={0.5}
        // shadow-camera-far={40}
      />
    </>
  );
}

export default memo(SceneLighting);
