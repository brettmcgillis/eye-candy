import { Color } from 'three';
import { attribute, color, mix, smoothstep } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { rust } from 'tsl-textures';

export default function createHandsMaterial({
  baseColor,
  accentColor,
  amount,
  scale,
  iterations,
  noise,
  noiseScale,
  seed,
  metalness,
  roughness,
  gradientTipColor,
  gradientWristColor,
  gradientStart = 0,
  gradientEnd = 1,
}) {
  const rustNode = rust({
    color: new Color(baseColor),
    background: new Color(accentColor),
    amount,
    scale,
    iterations,
    noise,
    noiseScale,
    seed,
  });

  let colorNode = rustNode;

  if (gradientTipColor && gradientWristColor) {
    const gradient = smoothstep(
      gradientStart,
      gradientEnd,
      attribute('prayerGradient')
    );
    const gradientColor = mix(
      color(gradientTipColor),
      color(gradientWristColor),
      gradient
    );

    colorNode = mix(
      color(gradientTipColor),
      rustNode.mul(gradientColor),
      gradient
    );
  }

  return new THREE.MeshStandardNodeMaterial({
    colorNode,
    metalness,
    roughness,
  });
}
