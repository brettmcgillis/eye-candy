import React from 'react';

import Censor from './Censor';

export default function CensorShapes({
  effectShape,
  pixelSize,
  refraction,
  planeWidth,
  planeHeight,
}) {
  return (
    <>
      {effectShape === 'Plane' && (
        <Censor pixelSize={pixelSize} refraction={refraction}>
          <planeGeometry args={[planeWidth, planeHeight]} />
        </Censor>
      )}
      {effectShape === 'TwoPanes' && (
        <>
          <Censor
            pixelSize={pixelSize}
            refraction={refraction}
            position={[0.5, 0.5, 0]}
          >
            <planeGeometry args={[1, 1]} />
          </Censor>
          <Censor
            pixelSize={pixelSize}
            refraction={refraction}
            position={[-0.5, -0.5, 0]}
          >
            <planeGeometry args={[1, 1]} />
          </Censor>
        </>
      )}
      {effectShape === 'Cube' && (
        <Censor pixelSize={pixelSize} refraction={refraction}>
          <boxGeometry args={[1, 1, 1]} />
        </Censor>
      )}
      {effectShape === 'Cubes' && (
        <Censor
          pixelSize={pixelSize}
          refraction={refraction}
          clipOffset={0.5}
          position={[0, 0, 1]}
        >
          <boxGeometry args={[1, 1, 1]} />
        </Censor>
      )}
      {effectShape === 'Torus' && (
        <Censor pixelSize={pixelSize} refraction={refraction}>
          <torusGeometry args={[0.5, 0.15, 16, 100]} />
        </Censor>
      )}
      {effectShape === 'Sphere' && (
        <Censor pixelSize={pixelSize} refraction={refraction}>
          <sphereGeometry args={[0.4, 32, 32]} />
        </Censor>
      )}
      {effectShape === 'Knot' && (
        <Censor pixelSize={pixelSize} refraction={refraction}>
          <torusKnotGeometry args={[0.5, 0.1, 100, 16]} />
        </Censor>
      )}
    </>
  );
}
