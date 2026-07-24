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
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uBands;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {

      // solid band or hole
      float band = step(0.5, fract(vUv.y * uBands));
      if (band > 0.5) discard;

      // radial glow
      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      // vertical gradient
      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);
      vec3 color = grad * glow * uIntensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ SunMaterial });

/* ----------------------------- SINGLE SUN ----------------------------- */

export default function Sun({
  colorTop = '#ff9bf5',
  colorBottom = '#ff2fa4',
  bands = 12,
  intensity = 2.2,
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
        side={THREE.FrontSide}
        depthWrite
        depthTest
        uColorTop={colorTop}
        uColorBottom={colorBottom}
        uBands={bands}
        uIntensity={intensity}
      />
    </mesh>
  );
}

/* ----------------------------- DOUBLE SUN ----------------------------- */

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
      {/* OUTER */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <sunMaterial
          ref={outer}
          side={THREE.FrontSide}
          depthWrite
          depthTest
          uColorTop={colorTop}
          uColorBottom={colorBottom}
          uBands={bands}
          uIntensity={intensity}
        />
      </mesh>

      {/* INNER */}
      <mesh scale={0.992}>
        <sphereGeometry args={[radius, 64, 64]} />
        <sunMaterial
          ref={inner}
          side={THREE.BackSide}
          depthWrite
          depthTest
          uColorTop={innerColorTop}
          uColorBottom={innerColorBottom}
          uBands={bands}
          uIntensity={intensity * 0.75}
        />
      </mesh>
    </group>
  );
}
