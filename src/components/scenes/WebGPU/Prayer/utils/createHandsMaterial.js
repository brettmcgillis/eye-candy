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
  clearcoat = 0,
  tipColor,
  wristColor,
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

  if (tipColor && wristColor) {
    const gradient = smoothstep(
      gradientStart,
      gradientEnd,
      attribute('prayerGradient')
    );
    colorNode = mix(
      color(tipColor),
      rustNode.mul(mix(color(tipColor), color(wristColor), gradient)),
      gradient
    );
  }

  return new THREE.MeshPhysicalNodeMaterial({
    colorNode,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
  });
}
