import * as THREE from 'three/webgpu';

const TOP_FACE_GROUP = 2;

// Open-topped so the ground tiles and their holes stay the only lid, and
// everything below street level reads as the inside of a solid plinth.
export default function createPedestalGeometry(size, depth) {
  const geometry = new THREE.BoxGeometry(size, depth, size);
  const top = geometry.groups[TOP_FACE_GROUP];
  const index = Array.from(geometry.index.array).filter(
    (_, i) => i < top.start || i >= top.start + top.count
  );

  geometry.setIndex(index);
  geometry.clearGroups();
  geometry.translate(0, -depth / 2, 0);

  return geometry;
}
