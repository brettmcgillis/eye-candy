import {
  Fn,
  clamp,
  dot,
  float,
  floor,
  fract,
  mix,
  positionLocal,
  pow,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo } from 'react';

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const DEFAULT_SMOKE = {
  timeFrequency: 0.45,
  uvFrequencyX: 1.0,
  uvFrequencyY: 1.5,
  riseSpeed: 0.35,
  spreadStrength: 0.18,
  opacity: 0.6,
  color: '#b8b8b8',
  width: 0.25,
  height: 3.0,
};

const random2 = Fn(([stInput]) => {
  const st = vec2(stInput).toVar();
  return fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453123));
}).setLayout({
  name: 'smokeRandom2',
  type: 'float',
  inputs: [{ name: 'stInput', type: 'vec2' }],
});

const noise2 = Fn(([stInput]) => {
  const st = vec2(stInput).toVar();
  const cell = floor(st).toVar();
  const fractPart = fract(st).toVar();
  const a = random2(cell).toVar();
  const b = random2(cell.add(vec2(1.0, 0.0))).toVar();
  const c = random2(cell.add(vec2(0.0, 1.0))).toVar();
  const d = random2(cell.add(vec2(1.0, 1.0))).toVar();
  const blend = fractPart
    .mul(fractPart)
    .mul(vec2(3.0, 3.0).sub(fractPart.mul(2.0)))
    .toVar();

  return mix(a, b, blend.x)
    .add(c.sub(a).mul(blend.y).mul(float(1.0).sub(blend.x)))
    .add(d.sub(b).mul(blend.x).mul(blend.y));
}).setLayout({
  name: 'smokeNoise2',
  type: 'float',
  inputs: [{ name: 'stInput', type: 'vec2' }],
});

const fbm2 = Fn(([pInput]) => {
  const p0 = vec2(pInput).toVar();
  const p1 = p0.mul(2.08).add(vec2(5.2, 1.3)).toVar();
  const p2 = p1.mul(2.08).add(vec2(1.7, 9.2)).toVar();
  const p3 = p2.mul(2.08).add(vec2(8.3, 2.8)).toVar();

  return noise2(p0)
    .mul(0.55)
    .add(noise2(p1).mul(0.264))
    .add(noise2(p2).mul(0.127))
    .add(noise2(p3).mul(0.061));
}).setLayout({
  name: 'smokeFbm2',
  type: 'float',
  inputs: [{ name: 'pInput', type: 'vec2' }],
});

export default function Smoke2DGPU({
  position = [0, 0, 0],
  inverted = false,
  smoke,
  visible = true,
}) {
  const cfg = { ...DEFAULT_SMOKE, ...smoke };
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(cfg.width, cfg.height, 2, 32),
    [cfg.width, cfg.height]
  );
  const scrollDir = 1.0;
  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      timeFrequency: uniform(cfg.timeFrequency),
      uvFrequencyX: uniform(cfg.uvFrequencyX),
      uvFrequencyY: uniform(cfg.uvFrequencyY),
      color: uniform(new THREE.Color(cfg.color)),
      opacity: uniform(cfg.opacity),
      riseSpeed: uniform(cfg.riseSpeed),
      spreadStrength: uniform(cfg.spreadStrength),
      scrollDir: uniform(scrollDir),
    }),
    []
  );

  useEffect(() => {
    uniforms.timeFrequency.value = cfg.timeFrequency;
    uniforms.uvFrequencyX.value = cfg.uvFrequencyX;
    uniforms.uvFrequencyY.value = cfg.uvFrequencyY;
    uniforms.color.value.set(cfg.color);
    uniforms.opacity.value = cfg.opacity;
    uniforms.riseSpeed.value = cfg.riseSpeed;
    uniforms.spreadStrength.value = cfg.spreadStrength;
    uniforms.scrollDir.value = scrollDir;
  }, [cfg, scrollDir, uniforms]);

  const material = useMemo(() => {
    const smokeUv = uv();
    const localPosition = positionLocal;
    const displacementUv = vec2(
      smokeUv.x.mul(4.0),
      smokeUv.y.mul(4.0).sub(
        uniforms.time.mul(uniforms.riseSpeed).mul(uniforms.scrollDir)
      )
    );
    const displacementStrength = pow(smokeUv.y.mul(2.8), 2.0);
    const waver = fbm2(displacementUv);
    const waver2 = noise2(displacementUv.mul(2.1).add(vec2(4.7, 0.0)));
    const displacedX = localPosition.x.add(
      waver
        .add(waver2.mul(0.3))
        .mul(displacementStrength)
        .mul(uniforms.spreadStrength)
    );

    const scrolledUv = vec2(
      smokeUv.x.mul(uniforms.uvFrequencyX),
      smokeUv.y
        .mul(uniforms.uvFrequencyY)
        .sub(uniforms.time.mul(uniforms.timeFrequency).mul(uniforms.scrollDir))
    );
    const edgeFade = smoothstep(0.0, 0.22, smokeUv.x).mul(
      float(1.0).sub(smoothstep(0.78, 1.0, smokeUv.x))
    );
    const tipFade = pow(float(1.0).sub(smokeUv.y), 0.65);
    const wickFade = smoothstep(0.0, 0.1, smokeUv.y);
    const density = clamp(
      fbm2(scrolledUv).mul(edgeFade).mul(tipFade).mul(wickFade).mul(uniforms.opacity),
      0.0,
      1.0
    );

    const nextMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    nextMaterial.positionNode = vec3(
      displacedX,
      localPosition.y,
      localPosition.z
    );
    nextMaterial.colorNode = uniforms.color;
    nextMaterial.opacityNode = density;

    return nextMaterial;
  }, [uniforms]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  if (!visible) {
    return null;
  }

  const meshY = inverted ? -(cfg.height / 2) : cfg.height / 2;
  const meshScale = inverted ? [1, -1, 1] : [1, 1, 1];

  return (
    <Billboard
      position={position}
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh position={[0, meshY, 0]} scale={meshScale} geometry={geometry}>
        <primitive object={material} attach="material" />
      </mesh>
    </Billboard>
  );
}
