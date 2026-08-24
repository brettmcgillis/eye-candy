import React, { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';

import { Color, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three';
import { EXRLoader } from 'three-stdlib';
import {
  Fn,
  Loop,
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  mix,
  mx_noise_float,
  normalMap,
  normalView,
  normalize,
  oneMinus,
  positionView,
  positionWorld,
  pow,
  reflector,
  screenUV,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Poly Haven asphalt_02 PBR set (in public/textures/asphalt/). The normal is an
// OpenGL-convention .exr, loaded via EXRLoader since useTexture can't read EXR.
const ASPHALT = {
  base: '/textures/asphalt/asphalt_02_diff_1k.jpg',
  rough: '/textures/asphalt/asphalt_02_rough_1k.jpg',
};
const ASPHALT_NORMAL = '/textures/asphalt/asphalt_02_nor_gl_1k.exr';
useTexture.preload(Object.values(ASPHALT));

// --- noise / hash helpers (ported from the storm-at-midnight road shader) ---

const hash12 = Fn(([p]) => {
  const p3 = fract(vec3(p.x, p.y, p.x).mul(0.1031)).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(19.19)));
  return fract(p3.x.add(p3.y).mul(p3.z));
});

const hash22 = Fn(([p]) => {
  const p3 = fract(
    vec3(p.x, p.y, p.x).mul(vec3(0.1031, 0.103, 0.0973))
  ).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(19.19)));
  return fract(p3.xx.add(p3.yz).mul(p3.zy));
});

// 4-octave fbm for organic puddle shapes.
const fbm = Fn(([p]) => {
  const value = float(0).toVar();
  const amp = float(0.5).toVar();
  const freq = p.toVar();
  Loop({ start: 0, end: 4, type: 'int' }, () => {
    value.addAssign(amp.mul(mx_noise_float(freq)));
    freq.mulAssign(2.0);
    amp.mulAssign(0.5);
  });
  return value;
});

// Expanding concentric rain ripples — direct port of the storm road's getRipples,
// returns a vec2 gradient (xz) used to distort the puddle reflections.
const getRipples = Fn(([uvCoord, t]) => {
  const R = 2;
  const p0 = floor(uvCoord).toVar();
  const tt = t.mul(2.0).toVar();
  const circles = vec2(0).toVar();

  Loop({ start: -R, end: R + 1, type: 'int' }, ({ i: j }) => {
    Loop({ start: -R, end: R + 1, type: 'int' }, ({ i }) => {
      const pi = p0.add(vec2(float(i), float(j))).toVar();
      const p = pi.add(hash22(pi)).toVar();
      const phase = fract(tt.mul(0.3).add(hash12(pi))).toVar();
      const v = p.sub(uvCoord).toVar();
      const d = length(v)
        .sub(float(R + 1).mul(phase))
        .toVar();

      const h = 0.001;
      const d1 = d.sub(h).toVar();
      const d2 = d.add(h).toVar();
      const s1 = sin(d1.mul(31))
        .mul(smoothstep(-0.6, -0.3, d1))
        .mul(smoothstep(0.0, -0.3, d1));
      const s2 = sin(d2.mul(31))
        .mul(smoothstep(-0.6, -0.3, d2))
        .mul(smoothstep(0.0, -0.3, d2));

      const falloff = oneMinus(phase).mul(oneMinus(phase));
      const grad = s2
        .sub(s1)
        .div(h * 2.0)
        .mul(falloff);
      circles.addAssign(normalize(v).mul(0.5).mul(grad));
    });
  });

  circles.divAssign(float((R * 2 + 1) * (R * 2 + 1)));
  return vec2(circles);
});

/**
 * Wet-asphalt ground — the demo-2024-a-storm-at-midnight puddle/mirror road
 * rebuilt for WebGPU/TSL. It reuses the SAME asphalt textures (BaseColor + Normal
 * + Roughness, extracted from that demo's bicycle.glb Road material into
 * public/textures/asphalt/) so the dry pavement matches the reference, then layers
 * the puddle system on top:
 *
 *  - fbm noise carves organic puddles into the textured asphalt
 *  - a real planar `reflector()` provides the mirror
 *  - animated concentric ripples distort the reflection UVs (the rained-on look)
 *  - reflection is faded by a fresnel term and only shows inside the puddles
 *  - puddles flatten the asphalt normal, drop roughness near 0, and darken the color
 *
 * The original was WebGL CSM + gl-noise + a screen-space reflection pass, none of
 * which run under WebGPU. Look params are TSL uniforms so Leva updates live.
 */
export default function WetGround({
  size = 44,
  asphaltColor,
  puddleColor,
  puddleScale,
  puddleAmount,
  texScale,
  reflectStrength,
  reflectTint,
  rippleScale,
  rippleStrength,
  rippleSpeed,
  roughDry,
  roughWet,
}) {
  const [baseMap, roughMap] = useTexture([ASPHALT.base, ASPHALT.rough]);
  const normalTex = useLoader(EXRLoader, ASPHALT_NORMAL);

  useEffect(() => {
    [baseMap, normalTex, roughMap].forEach((t) => {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
    });
    baseMap.colorSpace = SRGBColorSpace;
    normalTex.colorSpace = NoColorSpace;
    roughMap.colorSpace = NoColorSpace;
  }, [baseMap, normalTex, roughMap]);

  const u = useMemo(
    () => ({
      asphalt: uniform(new Color()),
      puddle: uniform(new Color()),
      tint: uniform(new Color()),
      scale: uniform(0.5),
      amount: uniform(0.5),
      texScale: uniform(0.22),
      reflect: uniform(0.6),
      rippleScale: uniform(6),
      rippleStrength: uniform(0.03),
      rippleSpeed: uniform(1),
      roughDry: uniform(0.9),
      roughWet: uniform(0.05),
    }),
    []
  );

  const reflection = useMemo(() => reflector({ resolutionScale: 0.75 }), []);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardNodeMaterial();
    const planar = positionWorld.xz;
    const texUV = planar.mul(u.texScale);

    // Puddle mask
    const noise = fbm(planar.mul(u.scale)).mul(0.5).add(0.5);
    const threshold = oneMinus(u.amount);
    const mask = smoothstep(threshold, threshold.add(0.12), noise).toVar();

    // Textured asphalt (matches the reference), tinted + darkened into puddles
    const baseTex = texture(baseMap, texUV).rgb;
    const dry = baseTex.mul(u.asphalt);
    m.colorNode = mix(dry, u.puddle, mask);

    // Roughness from the asphalt map on dry pavement, near-mirror in puddles
    const dryRough = clamp(texture(roughMap, texUV).g.mul(u.roughDry), 0, 1);
    m.roughnessNode = mix(dryRough, u.roughWet, mask);
    m.metalnessNode = mask.mul(0.3);

    // Asphalt normal map on dry pavement; flattened inside puddles so they mirror
    const bumpN = normalMap(texture(normalTex, texUV));
    m.normalNode = normalize(mix(bumpN, normalView, mask));

    // Animated ripples (only meaningful inside the puddles)
    const ripple = getRipples(
      planar.mul(u.rippleScale),
      time.mul(u.rippleSpeed)
    )
      .mul(u.rippleStrength)
      .mul(mask)
      .toVar();

    // Mirror reflection, UVs nudged by the ripples
    const reflUV = screenUV.flipX().add(ripple);
    const refl = reflection.sample(reflUV).rgb;

    // Fresnel: reflections strengthen toward grazing angles
    const viewDir = normalize(positionView.negate());
    const fresnel = pow(oneMinus(clamp(dot(normalView, viewDir), 0, 1)), 2.0);
    const reflWeight = mask.mul(mix(0.25, 1.0, fresnel)).mul(u.reflect);

    // Reflections as emissive so the puddles mirror the lit streetlight at night.
    m.emissiveNode = refl.mul(u.tint).mul(reflWeight);

    return m;
  }, [u, reflection, baseMap, normalTex, roughMap]);

  useEffect(() => {
    u.asphalt.value.set(asphaltColor);
    u.puddle.value.set(puddleColor);
    u.tint.value.set(reflectTint);
    u.scale.value = puddleScale;
    u.amount.value = puddleAmount;
    u.texScale.value = texScale;
    u.reflect.value = reflectStrength;
    u.rippleScale.value = rippleScale;
    u.rippleStrength.value = rippleStrength;
    u.rippleSpeed.value = rippleSpeed;
    u.roughDry.value = roughDry;
    u.roughWet.value = roughWet;
  }, [
    u,
    asphaltColor,
    puddleColor,
    reflectTint,
    puddleScale,
    puddleAmount,
    texScale,
    reflectStrength,
    rippleScale,
    rippleStrength,
    rippleSpeed,
    roughDry,
    roughWet,
  ]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow material={material}>
      <planeGeometry args={[size, size]} />
      <primitive object={reflection.target} />
    </mesh>
  );
}
