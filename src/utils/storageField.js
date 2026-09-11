import { NodeAccess, storageTexture } from 'three/tsl';
import * as THREE from 'three/webgpu';

// A float storage texture sized for a GPU field solver to ping-pong, with
// linear filtering so a consumer's vertex or fragment stage can sample it
// between texels. Clamped rather than wrapped matters: a wrapped field tiles
// its pattern across the seam, which reads as a repeat rather than a growth.
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
