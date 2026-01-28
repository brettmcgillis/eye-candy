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

      /* -----------------------
         Band mask (on/off only)
      ------------------------ */

      float band = step(0.5, fract(vUv.y * uBands));

      /* -----------------------
         Radial glow (brightness only)
      ------------------------ */

      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      /* -----------------------
         Gradient color
      ------------------------ */

      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);

      vec3 color = grad * glow * 2.2;

      /* -----------------------
         Final: solid bands, clear gaps
      ------------------------ */

      gl_FragColor = vec4(color, band);
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
    if (mat.current) mat.current.uTime += delta;
  });

  return (
    <mesh {...props}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <sunMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uColorTop={colorTop}
        uColorBottom={colorBottom}
        uBands={bands}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
