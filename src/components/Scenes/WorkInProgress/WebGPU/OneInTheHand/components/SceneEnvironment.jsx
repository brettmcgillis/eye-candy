import React from 'react';

function SceneEnvironment({
  ambientColor,
  ambientIntensity,
  backgroundColor,
  directionalColor,
  directionalIntensity,
  directionalPosition,
  fogColor,
  fogFar,
  fogNear,
}) {
  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <directionalLight
        castShadow
        color={directionalColor}
        intensity={directionalIntensity}
        position={[
          directionalPosition.x,
          directionalPosition.y,
          directionalPosition.z,
        ]}
        shadow-bias={-0.0005}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

export default React.memo(SceneEnvironment);
