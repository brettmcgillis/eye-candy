import * as THREE from 'three';

import React, { useEffect, useMemo } from 'react';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uEdgeSoftness;
  uniform float uWarpStrength;
  uniform float uBrushStrength;
  uniform float uBleedAmount;
  uniform float uPoolingStrength;
  uniform float uGrainAmount;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered * vec2(1.0, 1.5));

    vec2 q = vec2(
      fbm(vUv * 5.0),
      fbm(vUv * 5.0 + vec2(5.2, 1.3))
    );
    float warp = fbm(vUv * 5.0 + 3.0 * q);

    float brush = (noise(vec2(vUv.x * 3.0 + warp, vUv.y * 18.0)) * 0.07
                + noise(vec2(vUv.x * 6.0, vUv.y * 30.0)) * 0.03) * uBrushStrength;

    float edgeNoise = warp * uWarpStrength + brush;

    float edge = smoothstep(0.50, 0.50 - uEdgeSoftness + edgeNoise, dist);
    float bleed = smoothstep(0.56, 0.56 - uEdgeSoftness * 0.9 + edgeNoise * 0.6, dist)
                * uBleedAmount;

    float alpha = max(edge, bleed);

    float pooling = smoothstep(0.15, 0.42, dist);
    vec3 lightWash = uColor * 1.05;
    vec3 pooledEdge = uColor * 0.78;
    vec3 col = mix(lightWash, pooledEdge, pooling * pooling * uPoolingStrength);

    col += vec3(0.02, -0.01, -0.02) * warp;

    float grain = noise(vUv * 180.0) * uGrainAmount - uGrainAmount * 0.5;
    col += grain;

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function SkyPanel({ sky }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color('#87CEEB') },
          uEdgeSoftness: { value: 0.22 },
          uWarpStrength: { value: 0.1 },
          uBrushStrength: { value: 1.0 },
          uBleedAmount: { value: 0.12 },
          uPoolingStrength: { value: 1.0 },
          uGrainAmount: { value: 0.035 },
        },
        vertexShader,
        fragmentShader,
      }),
    []
  );

  useEffect(() => {
    const { uniforms } = material;
    uniforms.uColor.value.set(sky.color);
    uniforms.uEdgeSoftness.value = sky.shader.edgeSoftness;
    uniforms.uWarpStrength.value = sky.shader.warpStrength;
    uniforms.uBrushStrength.value = sky.shader.brushStrength;
    uniforms.uBleedAmount.value = sky.shader.bleedAmount;
    uniforms.uPoolingStrength.value = sky.shader.poolingStrength;
    uniforms.uGrainAmount.value = sky.shader.grainAmount;
  }, [material, sky]);

  return (
    <mesh position={sky.position} material={material} renderOrder={-10}>
      <planeGeometry args={[sky.width, sky.height]} />
    </mesh>
  );
}
