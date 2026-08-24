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

      {/*
        This light only drives the godrays effect, which samples the scene
        DEPTH pass (not this light's shadow map). A shadow-casting point light
        renders the whole scene 6× per frame (one per cube face) — at 4096² that
        was the scene's main per-frame cost and nothing consumed it. Shadows now
        come solely from the directional key light above.
      */}
      <pointLight
        ref={godraysLightRef}
        color={godraysColor}
        intensity={godraysIntensity}
        position={godraysPosition}
        distance={40}
        decay={1.8}
      />
    </>
  );
}

export default memo(SceneLighting);
