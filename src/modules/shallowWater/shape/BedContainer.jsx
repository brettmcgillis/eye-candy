import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import { bedOutline } from './bedShape';

// ExtrudeGeometry builds in XY and is stood up with rotateX(-PI/2), which maps
// (x, y) to (x, -z) -- so the outline's z has to go in negated.
const cornersOf = (points) => points.map(([x, z]) => new THREE.Vector2(x, -z));

function prism(outer, hole, depth) {
  const shape = new THREE.Shape(cornersOf(outer));
  if (hole) shape.holes.push(new THREE.Path(cornersOf(hole)));

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    depth,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// The sandbox the grain bed sits in: one solid carved to the bed's own
// outline, as walls standing on a floor slab rather than a real boolean --
// two extrusions of the same polygon are exact for every shape and cost no
// BVH build on a rotation drag. No shadow flags: neither scene's lighting
// declares a caster, on purpose.
function BedContainer({ config, floor, rim, shape }) {
  const outer = useMemo(
    () => bedOutline(shape, config.containerWall),
    [config.containerWall, shape]
  );
  const inner = useMemo(() => bedOutline(shape), [shape]);

  const walls = useMemo(
    () => prism(outer, inner, Math.max(0.01, rim - floor)),
    [floor, inner, outer, rim]
  );
  const slab = useMemo(
    () => prism(outer, null, Math.max(0.01, config.containerFloor)),
    [config.containerFloor, outer]
  );

  const material = useMemo(() => {
    const created = new THREE.MeshStandardNodeMaterial();
    created.color = new THREE.Color(config.containerColor);
    created.metalness = config.containerMetalness;
    created.roughness = config.containerRoughness;
    return created;
  }, [
    config.containerColor,
    config.containerMetalness,
    config.containerRoughness,
  ]);

  useEffect(
    () => () => {
      walls.dispose();
      slab.dispose();
    },
    [slab, walls]
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    <group>
      <mesh geometry={walls} position-y={floor}>
        <primitive attach="material" object={material} />
      </mesh>
      <mesh geometry={slab} position-y={floor - config.containerFloor}>
        <primitive attach="material" object={material} />
      </mesh>
    </group>
  );
}

export default memo(BedContainer);
