import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { color as tslColor } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  buildAshColor,
  buildAshRoughness,
  createSurfaceUniforms,
  setSurfaceOffset,
} from '../utils/surfaceNodes';

// Ash-grey, matte, mottled, and entirely procedural — there are no texture
// maps in this scene by design. Photographic sets tile visibly across a room
// tens of metres wide and a shaft sixty across, and the source describes
// surfaces with no construction seams to read in the first place.
export default function useSurfaces(config, walker) {
  const uniforms = useMemo(() => createSurfaceUniforms(), []);

  const surfaces = useMemo(() => {
    const build = (hex, dim, side) => {
      const material = new THREE.MeshStandardNodeMaterial({
        metalness: 0,
        side,
      });
      material.colorNode = buildAshColor(
        tslColor(new THREE.Color(hex).multiplyScalar(dim)),
        uniforms
      );
      material.roughnessNode = buildAshRoughness(uniforms);
      return material;
    };
    return {
      // Double-sided, and it has to be: every piece in the kit is a single
      // surface with no thickness, wound for its own construction rather than
      // to a common outward convention. Nearly 40% of a threshold's triangles
      // face away from the room they close, so culling back faces does not
      // hide a wall — it makes a hole you can see out of.
      stone: build(config.baseColor, 1, THREE.DoubleSide),
      // The shaft wall is lofted with its normals pointing inward, so front
      // faces are the ones seen from inside the shaft. Culling the back faces
      // costs nothing there and leaves the tube transparent from outside,
      // which is the cutaway the orbit camera wants. It also sits further from
      // the lamp than anything else, so it is knocked back rather than lit up.
      wall: build(config.baseColor, 0.8, THREE.FrontSide),
    };
  }, [config.baseColor, uniforms]);

  useEffect(
    () => () => Object.values(surfaces).forEach((m) => m.dispose()),
    [surfaces]
  );

  useEffect(() => {
    uniforms.inkAmount.value = config.inkAmount;
    uniforms.inkFlow.value = config.inkFlow;
    uniforms.inkScale.value = config.inkScale;
    uniforms.inkThreshold.value = config.inkThreshold;
    uniforms.inkWarp.value = config.inkWarp;
    uniforms.mottleAmount.value = config.mottleAmount;
    uniforms.mottleScale.value = config.mottleScale;
    uniforms.roughBase.value = config.roughBase;
    uniforms.roughVary.value = config.roughVary;
  }, [config, uniforms]);

  useFrame(() => {
    setSurfaceOffset(uniforms, walker.anchor, walker.frame?.riseRef ?? 0);
  });

  return surfaces;
}
