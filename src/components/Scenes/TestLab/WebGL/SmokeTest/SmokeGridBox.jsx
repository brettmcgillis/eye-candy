import * as THREE from 'three';

import React, { useMemo } from 'react';

// Same dimensions as SplineEditor's grid box, white/grey colour scheme.
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
    vec3 absP = abs(vLocalPos);
    vec2 gridUV;
    if (absP.x >= absP.y && absP.x >= absP.z) {
      gridUV = vLocalPos.yz;
    } else if (absP.y >= absP.x && absP.y >= absP.z) {
      gridUV = vLocalPos.xz;
    } else {
      gridUV = vLocalPos.xy;
    }
    vec2 f = fract(gridUV / gridSize);
    float line = max(step(f.x, lineWidth), step(f.y, lineWidth));
    gl_FragColor = vec4(mix(bgColor, lineColor, line), 1.0);
  }
`;

export default function SmokeGridBox() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          bgColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
          lineColor: { value: new THREE.Vector3(0.82, 0.82, 0.82) },
          gridSize: { value: 100.0 },
          lineWidth: { value: 0.02 },
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
