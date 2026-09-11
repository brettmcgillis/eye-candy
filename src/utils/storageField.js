import { NodeAccess, storageTexture } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Every solver here ping-pongs float storage textures with linear filtering and
// clamped edges. Clamped rather than wrapped matters: a wrapped field tiles its
// pattern across the seam, which reads as a repeat rather than a growth.
export default function createFieldTexture(width, height) {
  const texture = new THREE.StorageTexture(width, height);
  texture.type = THREE.FloatType;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const readOnly = (texture) =>
  storageTexture(texture).setAccess(NodeAccess.READ_ONLY);

export const writeOnly = (texture) =>
  storageTexture(texture).setAccess(NodeAccess.WRITE_ONLY);
