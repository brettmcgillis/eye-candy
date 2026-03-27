import React from 'react';

function BoatLights() {
  return (
    <>
      {/* Headlight — front of the boat */}
      <pointLight
        position={[0, 0.6, -5]}
        intensity={2}
        distance={8}
        decay={2}
        color="#ffe8b0"
      />
      {/* Cabin interior light */}
      <pointLight
        position={[0, 1.2, 1]}
        intensity={1.5}
        distance={5}
        decay={2}
        color="#ffd080"
      />
    </>
  );
}

export default React.memo(BoatLights);
