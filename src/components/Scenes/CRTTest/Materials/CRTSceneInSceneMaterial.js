/* eslint-disable no-unused-vars */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';

/* ---------------- shaders ---------------- */

const vertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

const fragmentShader = `
uniform sampler2D uScene;
uniform sampler2D uFeedback;
uniform float uTime;

uniform float uDecay;
uniform float uZoom;
uniform float uWarp;

uniform float uStaticAmount;
uniform float uScanlineStrength;
uniform float uCurvature;
uniform float uVignette;

varying vec2 vUv;

float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv,float k){
  uv = uv*2.0-1.0;
  uv *= 1.0 + k * pow(abs(uv.yx),vec2(2.0));
  return uv*0.5+0.5;
}

void main(){
  vec2 uv = vUv;

  // warp feedback inward (recursion illusion)
  vec2 fUV = (uv - 0.5) / uZoom + 0.5;
  fUV += sin(vec2(uv.y, uv.x) * 6.0 + uTime*0.4) * 0.003 * uWarp;
  fUV = curve(fUV, uCurvature);

  vec3 sceneCol = texture2D(uScene, uv).rgb;
  vec3 feedbackCol = texture2D(uFeedback, fUV).rgb;

  vec3 col = mix(sceneCol, feedbackCol, uDecay);

  col -= sin(uv.y*900.0)*0.04*uScanlineStrength;
  col = mix(col, vec3(hash(uv*600.0+uTime)), uStaticAmount);

  float d = distance(uv,vec2(0.5));
  col *= 1.0-smoothstep(0.6,uVignette,d);

  gl_FragColor = vec4(col,1.0);
}
`;

const CrtAccumMaterial = shaderMaterial(
  {
    uScene: null,
    uFeedback: null,
    uTime: 0,
    uDecay: 0.85,
    uZoom: 1.01,
    uWarp: 0.6,
    uStaticAmount: 0.04,
    uScanlineStrength: 0.4,
    uCurvature: 0.12,
    uVignette: 0.85,
  },
  vertexShader,
  fragmentShader
);

extend({ CrtAccumMaterial });

/* ---------------- material ---------------- */

export default function CRTSceneInSceneMaterial({
  resolution = 1024,

  decay = 0.85,
  zoom = 1.01,
  warp = 0.6,

  staticAmount = 0.04,
  scanlineStrength = 0.4,
  curvature = 0.12,
  vignette = 0.85,
}) {
  const mat = useRef();
  const { gl, scene, camera } = useThree();

  const sceneRT = useMemo(
    () => new THREE.WebGLRenderTarget(resolution, resolution),
    [resolution]
  );
  const fbA = useMemo(
    () => new THREE.WebGLRenderTarget(resolution, resolution),
    [resolution]
  );
  const fbB = useMemo(
    () => new THREE.WebGLRenderTarget(resolution, resolution),
    [resolution]
  );

  const swap = useRef(false);

  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uTime += dt;

    const prev = gl.getRenderTarget();

    // 1. render world once
    gl.setRenderTarget(sceneRT);
    gl.clear();
    gl.render(scene, camera);

    // 2. feedback pass (GPU cheap)
    const read = swap.current ? fbA : fbB;
    const write = swap.current ? fbB : fbA;

    mat.current.uScene = sceneRT.texture;
    mat.current.uFeedback = read.texture;

    gl.setRenderTarget(write);
    gl.clear();
    gl.render(scene, camera); // screen draws feedback into itself

    gl.setRenderTarget(prev);
    swap.current = !swap.current;

    // 3. display accumulated result
    mat.current.uFeedback = write.texture;
  });

  return (
    <crtAccumMaterial
      ref={mat}
      uDecay={decay}
      uZoom={zoom}
      uWarp={warp}
      uStaticAmount={staticAmount}
      uScanlineStrength={scanlineStrength}
      uCurvature={curvature}
      uVignette={vignette}
      toneMapped={false}
    />
  );
}
