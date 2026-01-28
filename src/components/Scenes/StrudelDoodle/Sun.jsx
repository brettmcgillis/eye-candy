import * as THREE from 'three';

import React, { useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const SunMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorTop: new THREE.Color('#ff9bf5'),
    uColorBottom: new THREE.Color('#ff2fa4'),
    uBands: 12,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uBands;
    varying vec2 vUv;

    void main() {
      float bands = step(0.5, fract(vUv.y * uBands));
      float glow = smoothstep(0.0, 0.3, 1.0 - distance(vUv, vec2(0.5)));

      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);
      vec3 color = grad * bands;

      gl_FragColor = vec4(color * glow * 2.2, 1.0);
    }
  `
);

extend({ SunMaterial });

export default function Sun({
  colorTop = '#ff9bf5',
  colorBottom = '#ff2fa4',
  bands = 12,
  ...props
}) {
  const mat = useRef();

  useFrame((_, delta) => {
    mat.current.uTime += delta;
  });

  return (
    <mesh {...props}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <sunMaterial
        ref={mat}
        transparent
        uColorTop={colorTop}
        uColorBottom={colorBottom}
        uBands={bands}
      />
    </mesh>
  );
}
