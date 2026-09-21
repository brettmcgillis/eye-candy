import React, { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { polygonOutline } from '@utils/regularPolygon';

import { applyCausticUniforms, buildCausticUniforms } from './causticShadow';
import buildContainerMaterial from './containerMaterial';

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
// BVH build on a rotation drag.
function BedContainer({ config, floor, rim, shadows = false, shape }) {
  const gl = useThree((state) => state.gl);
  const outer = useMemo(
    () => polygonOutline(shape, config.containerWall),
    [config.containerWall, shape]
  );
  const inner = useMemo(() => polygonOutline(shape), [shape]);

  const walls = useMemo(
    () => prism(outer, inner, Math.max(0.01, rim - floor)),
    [floor, inner, outer, rim]
  );
  const slab = useMemo(
    () => prism(outer, null, Math.max(0.01, config.containerFloor)),
    [config.containerFloor, outer]
  );

  const caustics = useMemo(() => buildCausticUniforms(), []);
  applyCausticUniforms(caustics, config);

  const material = useMemo(
    () => buildContainerMaterial(config, caustics),
    [
      caustics,
      config.containerColor,
      config.containerIor,
      config.containerMaterial,
      config.containerMetalness,
      config.containerOpacity,
      config.containerRoughness,
      config.containerThickness,
    ]
  );

  useEffect(
    () => () => {
      walls.dispose();
      slab.dispose();
    },
    [slab, walls]
  );
  useEffect(() => () => material.dispose(), [material]);

  // A transmissive container writes its castShadowNode into the shadow map
  // rather than opaque black, which three only honours with this set.
  useEffect(() => {
    if (!shadows || config.containerMaterial === 'Matte') return undefined;
    const previous = gl.shadowMap.transmitted;
    gl.shadowMap.transmitted = true;
    return () => {
      gl.shadowMap.transmitted = previous;
    };
  }, [config.containerMaterial, gl, shadows]);

  const casts = shadows;

  return (
    <group>
      <mesh
        castShadow={casts}
        geometry={walls}
        position-y={floor}
        receiveShadow={shadows}
      >
        <primitive attach="material" object={material} />
      </mesh>
      <mesh
        castShadow={casts}
        geometry={slab}
        position-y={floor - config.containerFloor}
        receiveShadow={shadows}
      >
        <primitive attach="material" object={material} />
      </mesh>
    </group>
  );
}

export default memo(BedContainer);
