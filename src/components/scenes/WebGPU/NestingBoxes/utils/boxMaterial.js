import {
  floor,
  fract,
  instanceIndex,
  min,
  mix,
  positionGeometry,
  smoothstep,
  uint,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createColorNodes, createColorUniforms } from './colorNodes';
import { createSurfaceNodes, createSurfaceUniforms } from './surfaceNodes';

export function createBoxUniforms() {
  return {
    color: createColorUniforms(),
    drawLevel: uniform(14, 'uint'),
    progress: uniform(14),
    surface: createSurfaceUniforms(),
  };
}

// One instance per node at `drawLevel`, blended out of its ancestor at the
// progress floor. Drawing every leaf as its ancestor instead stacks thousands of
// identical boxes on top of each other and stalls the GPU on overdraw.
export function getDrawLevel(progress, levels) {
  const lo = Math.min(Math.floor(progress), levels);
  return progress > lo ? Math.min(lo + 1, levels) : lo;
}

export function buildBoxMaterial({ maps, paletteTexture, tree, uniforms: u }) {
  const node = uint(1).shiftLeft(u.drawLevel).add(instanceIndex);
  const lo = min(uint(floor(u.progress)), u.drawLevel);
  const blend = smoothstep(0, 1, fract(u.progress));
  const from = node.shiftRight(u.drawLevel.sub(lo));
  const to = node;

  const centerOf = (id) => tree.centers.element(id).xyz;
  const radiusOf = (id) => tree.radii.element(id).xyz;

  const colors = createColorNodes({ paletteTexture, uniforms: u.color });
  const surface = createSurfaceNodes({ maps, uniforms: u.surface });

  const boxColor = colors.boxColor({
    blend,
    from: { center: centerOf(from), id: from, radius: radiusOf(from) },
    to: { center: centerOf(to), id: to, radius: radiusOf(to) },
  });

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.positionNode = positionGeometry
    .mul(mix(radiusOf(from), radiusOf(to), blend))
    .add(mix(centerOf(from), centerOf(to), blend));
  material.colorNode = surface.applyAlbedo(boxColor);
  material.normalNode = surface.normalView;
  material.roughnessNode = surface.roughness;

  return {
    material,
    setMaps: surface.setMaps,
    setPalette: colors.setPalette,
  };
}
