/* eslint-disable no-plusplus */
import * as THREE from 'three';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';

export const MAX_POINTS = 8;

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
#define MAX_POINTS ${MAX_POINTS}
uniform float uTime;
uniform vec2 uResolution;
uniform int uPointCount;
uniform vec4 uPoints[MAX_POINTS];
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curlNoise(vec2 p) {
  float e = 0.001;
  float n1 = hash(p + vec2(0.0,e));
  float n2 = hash(p - vec2(0.0,e));
  float n3 = hash(p + vec2(e,0.0));
  float n4 = hash(p - vec2(e,0.0));
  return normalize(vec2(n1-n2,n3-n4));
}

void main() {
  vec2 uv = vUv;
  vec3 color = vec3(0.05,0.05,0.08);

  uv += curlNoise(uv * 3.0 + uTime * 0.1) * 0.025;

  for (int i=0;i<MAX_POINTS;i++) {
    if (i >= uPointCount) break;
    vec2 p = uPoints[i].xy;
    vec2 v = uPoints[i].zw;
    float d = distance(uv,p);
    float w = exp(-d*10.0);
    uv += vec2(-v.y,v.x)*w*1.8;
    color = mix(color, vec3(0.6,0.4,0.7), w);
  }

  gl_FragColor = vec4(color,1.0);
}
`;

const FluidMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uPointCount: 0,
    uPoints: Array.from({ length: MAX_POINTS }, () => new THREE.Vector4()),
  },
  vertexShader,
  fragmentShader
);

extend({ FluidMaterialImpl });

const FluidMaterial = forwardRef((_, ref) => {
  const mat = useRef();
  const { size } = useThree();

  const points = useRef([]);
  const prev = useRef([]);

  useImperativeHandle(ref, () => ({
    setPoints(next) {
      points.current = next;
    },
  }));

  useFrame((__, dt) => {
    if (!mat.current) return;

    mat.current.uTime += dt;
    mat.current.uResolution.set(size.width, size.height);
    mat.current.uPointCount = points.current.length;

    for (let i = 0; i < MAX_POINTS; i++) {
      const c = points.current[i];
      const p = prev.current[i] || c;
      if (c) {
        mat.current.uPoints[i].set(c.x, c.y, c.x - p.x, c.y - p.y);
      } else {
        mat.current.uPoints[i].set(0, 0, 0, 0);
      }
    }

    prev.current = points.current.map((v) => ({ ...v }));
  });

  return <fluidMaterialImpl ref={mat} />;
});

export default FluidMaterial;
