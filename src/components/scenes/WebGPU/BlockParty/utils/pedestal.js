import * as THREE from 'three/webgpu';

const BOX_TOP_GROUP = 2;
const CYLINDER_TOP_GROUP = 1;
const RIM_SEGMENTS = 128;

function withoutGroup(geometry, groupIndex) {
  const group = geometry.groups[groupIndex];
  const index = Array.from(geometry.index.array).filter(
    (_, i) => i < group.start || i >= group.start + group.count
  );

  geometry.setIndex(index);
  geometry.clearGroups();

  return geometry;
}

// Open-topped so the ground lid and its holes stay the only cover, and
// everything below street level reads as the inside of a solid plinth.
export default function createPedestalGeometry({ depth, radius, shape }) {
  const geometry =
    shape === 'circle'
      ? withoutGroup(
          new THREE.CylinderGeometry(radius, radius, depth, RIM_SEGMENTS),
          CYLINDER_TOP_GROUP
        )
      : withoutGroup(
          new THREE.BoxGeometry(radius * 2, depth, radius * 2),
          BOX_TOP_GROUP
        );

  geometry.translate(0, -depth / 2, 0);

  return geometry;
}
