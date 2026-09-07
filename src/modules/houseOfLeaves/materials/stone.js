import * as THREE from 'three/webgpu';

export const STONE_DEFAULTS = {
  color: '#3a3a38',
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
};

// Ash-grey, fully rough, no metal: the constellation's surfaces absorb light
// rather than return it. Double-sided by default — these pieces are single
// surfaces with no thickness, so back-face culling makes you see straight
// through them. Scenes layer their own colorNode on top.
export default function createStoneMaterial(options = {}) {
  const o = { ...STONE_DEFAULTS, ...options };
  return new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color(o.color),
    metalness: o.metalness,
    roughness: o.roughness,
    side: o.side ?? THREE.DoubleSide,
  });
}
