import React from 'react';

function BoatLights({
  lightDebug = false,
  headlightX = 0,
  headlightY = 0.6,
  headlightZ = -5,
  headlightIntensity = 2,
  headlightDistance = 8,
  headlightColor = '#ffe8b0',
  cabinX = 0,
  cabinY = 1.2,
  cabinZ = 1,
  cabinIntensity = 1.5,
  cabinDistance = 5,
  cabinColor = '#ffd080',
}) {
  return (
    <>
      {/* Headlight */}
      <pointLight
        position={[headlightX, headlightY, headlightZ]}
        intensity={headlightIntensity}
        distance={headlightDistance}
        decay={2}
        color={headlightColor}
      />
      {lightDebug && (
        <mesh position={[headlightX, headlightY, headlightZ]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial color={headlightColor} wireframe />
        </mesh>
      )}
      {/* Cabin interior light */}
      <pointLight
        position={[cabinX, cabinY, cabinZ]}
        intensity={cabinIntensity}
        distance={cabinDistance}
        decay={2}
        color={cabinColor}
      />
      {lightDebug && (
        <mesh position={[cabinX, cabinY, cabinZ]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial color={cabinColor} wireframe />
        </mesh>
      )}
    </>
  );
}

export default React.memo(BoatLights);
