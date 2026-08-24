import React, { useMemo } from 'react';

import * as THREE from 'three';

// Default box matches the SplineEditor workspace (2000-unit world, floor at Y=-200).
// Pass smaller values (e.g. size=20, gridSize=1) for scene-scale toolbox scenes.
const DEFAULT_SIZE = 2000;
const DEFAULT_GRID_SIZE = 100;

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

// Parse '#rrggbb' to raw sRGB [0..1] Vector3, bypassing THREE.Color linearization
// so uniform values match the scene background <color> display path.
function hexToRawVec3(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new THREE.Vector3(r, g, b);
}

export default function GridBoxGL({
  bgColor = '#3a4a5c',
  lineColor = '#1a2330',
  lineWidth = 0.025,
  size = DEFAULT_SIZE,
  gridSize = DEFAULT_GRID_SIZE,
}) {
  // Floor sits 10% of box size below the origin so there's a bit of underground
  // space — consistent across both large-world and scene-scale toolbox scenes.
  const boxCenterY = size / 2 - size * 0.1;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          bgColor: { value: hexToRawVec3(bgColor) },
          lineColor: { value: hexToRawVec3(lineColor) },
          gridSize: { value: gridSize },
          lineWidth: { value: lineWidth },
        },
        side: THREE.BackSide,
      }),
    [bgColor, lineColor, lineWidth, gridSize]
  );

  return (
    <mesh position={[0, boxCenterY, 0]} material={material}>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  );
}
