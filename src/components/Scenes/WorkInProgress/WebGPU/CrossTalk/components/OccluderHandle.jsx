import { Fn, positionLocal, smoothstep, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import usePointDrag from '../hooks/usePointDrag';
import { occluderSDF } from '../utils/radialShadowTSL';

const OCCLUDER_COLOR = '#d97722';
// The preview quad is a bit larger than the shape's radius so shapes that
// extend past `size` (heart, clover, cross) aren't clipped.
const QUAD_SCALE = 2.6;

// The draggable occluder marker. Rather than a per-shape Three.js geometry, it
// fills a single quad with the *same* occluderSDF the scene shades against, so
// every shape (including the marker SDFs) previews exactly and adding a shape
// needs no change here. DoubleSide because DesktopStage's ortho camera is
// Y-flipped (reverses winding); rotation is applied to the mesh so the SDF
// stays in local space, matching the scene's rotate-by-(-rotation) sampling.
function OccluderHandle({
  center,
  draggable,
  onDrag,
  rect,
  rotation,
  shape,
  size,
}) {
  const dragHandlers = usePointDrag({ draggable, onDrag, rect });

  const { material, uniforms } = useMemo(() => {
    const shapeU = uniform(0);
    const sizeU = uniform(new THREE.Vector2(1, 1));
    const colorU = uniform(new THREE.Color(OCCLUDER_COLOR));
    const mat = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
    mat.colorNode = Fn(() => {
      const p = positionLocal.xy.mul(sizeU.x.mul(QUAD_SCALE));
      const dist = occluderSDF(shapeU, p, sizeU);
      const aa = sizeU.x.mul(0.03).add(0.75);
      const fill = smoothstep(aa, aa.negate(), dist);
      return vec4(colorU, fill.mul(0.85));
    })();
    return { material: mat, uniforms: { colorU, shapeU, sizeU } };
  }, []);

  useEffect(() => {
    uniforms.shapeU.value = shape;
    uniforms.sizeU.value.set(size, size);
  }, [uniforms, shape, size]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      {...dragHandlers}
      frustumCulled={false}
      material={material}
      position={[center.x, center.y, 1]}
      rotation={[0, 0, rotation]}
      scale={size * QUAD_SCALE}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default memo(OccluderHandle);
