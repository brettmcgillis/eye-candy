import React from 'react';

export default function Lights() {
  return (
    <>
      <directionalLight
        castShadow
        shadow-normalBias={0.06}
        position={[20, 30, 10]}
        intensity={5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-top={50}
        shadow-camera-right={50}
        shadow-camera-bottom={-50}
        shadow-camera-left={-50}
        name="followLight"
      />
      <ambientLight intensity={2} />
    </>
  );
}
