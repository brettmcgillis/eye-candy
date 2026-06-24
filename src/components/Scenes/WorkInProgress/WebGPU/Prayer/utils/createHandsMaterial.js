import { Color } from 'three';
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
}) {
  return new THREE.MeshStandardNodeMaterial({
    colorNode: rust({
      color: new Color(baseColor),
      background: new Color(accentColor),
      amount,
      scale,
      iterations,
      noise,
      noiseScale,
      seed,
    }),
    metalness,
    roughness,
  });
}
