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
    uIntensity: 2.2,
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
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {

      // band mask (solid or hole)
      float band = step(0.5, fract(vUv.y * uBands));

      // radial glow (brightness only)
      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      // vertical gradient
      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);

      vec3 color = grad * glow * uIntensity;

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

export function DoubleLayerSun({
  colorTop = '#ff9bf5',
  colorBottom = '#ff2fa4',
  innerColorTop = '#6b2cff',
  innerColorBottom = '#14002b',
  bands = 12,
  intensity = 2.2,
  radius = 1.5,
  ...props
}) {
  const outer = useRef();
  const inner = useRef();

  useFrame((_, delta) => {
    if (outer.current) outer.current.uTime += delta;
    if (inner.current) inner.current.uTime += delta * 0.6;
  });

  return (
    <group {...props}>
      {/* OUTER SHELL */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <sunMaterial
          ref={outer}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
          uColorTop={colorTop}
          uColorBottom={colorBottom}
          uBands={bands}
          uIntensity={intensity}
        />
      </mesh>

      {/* INNER SHELL */}
      <mesh scale={0.995}>
        <sphereGeometry args={[radius, 64, 64]} />
        <sunMaterial
          ref={inner}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uColorTop={innerColorTop}
          uColorBottom={innerColorBottom}
          uBands={bands}
          uIntensity={intensity * 0.8}
        />
      </mesh>
    </group>
  );
}
