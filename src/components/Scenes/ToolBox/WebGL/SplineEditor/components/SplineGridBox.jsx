import * as THREE from 'three';

import React, { useMemo } from 'react';

// The box is 2000 units on each side, centered at Y=800 so the floor sits at Y=-200
// matching the rest of the scene's workspace layout.
const BOX_SIZE = 2000;
const BOX_CENTER_Y = BOX_SIZE / 2 - 200; // 800

const vertexShader = /* glsl */ `
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 bgColor;
  uniform vec3 lineColor;
  uniform float gridSize;
  uniform float lineWidth;
  varying vec3 vLocalPos;

  void main() {
    // Determine dominant face axis so each face gets its own 2D grid UV.
    vec3 absP = abs(vLocalPos);
    vec2 gridUV;
    if (absP.x >= absP.y && absP.x >= absP.z) {
      gridUV = vLocalPos.yz;
    } else if (absP.y >= absP.x && absP.y >= absP.z) {
      gridUV = vLocalPos.xz;
    } else {
      gridUV = vLocalPos.xy;
    }

    // Draw grid lines at every gridSize world units.
    vec2 f = fract(gridUV / gridSize);
    float line = max(step(f.x, lineWidth), step(f.y, lineWidth));

    gl_FragColor = vec4(mix(bgColor, lineColor, line), 1.0);
  }
`;

export default function SplineGridBox() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          // Use Vector3 with raw sRGB floats to bypass THREE.Color linearization,
          // so values match the scene background <color> display path.
          bgColor: {
            value: new THREE.Vector3(0x3a / 255, 0x4a / 255, 0x5c / 255),
          },
          lineColor: {
            value: new THREE.Vector3(0x1a / 255, 0x23 / 255, 0x30 / 255),
          },
          gridSize: { value: 100.0 },
          lineWidth: { value: 0.025 },
        },
        side: THREE.BackSide,
      }),
    []
  );

  return (
    <mesh position={[0, BOX_CENTER_Y, 0]} material={material}>
      <boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />
    </mesh>
  );
}
