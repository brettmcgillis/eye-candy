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
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createColorNodes, createColorUniforms } from './colorNodes';
import { createSurfaceNodes, createSurfaceUniforms } from './surfaceNodes';
import { createWindowNodes, createWindowUniforms } from './windowNodes';

export function createBoxUniforms() {
  return {
    color: createColorUniforms(),
    drawLevel: uniform(14, 'uint'),
    progress: uniform(14),
    surface: createSurfaceUniforms(),
    windows: createWindowUniforms(),
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

  const center = mix(centerOf(from), centerOf(to), blend);
  const radius = mix(radiusOf(from), radiusOf(to), blend);

  // Colour and windows share one identity: the building this box descends from.
  // Keying either to the drawn box re-rolls the whole structure every time
  // growth replaces a box with its children.
  const anchorDepth = min(u.color.identityLevel, u.drawLevel);
  const anchor = node.shiftRight(u.drawLevel.sub(anchorDepth));
  const anchorCenter = centerOf(anchor);
  const anchorRadius = radiusOf(anchor);

  // Three varyings carry everything the fragment stage needs. A vertex output
  // budget of 16 is shared with fog, shadows and the surface maps, so the box
  // and its anchor are packed rather than sent as separate vectors, and every
  // colour decision is made in the fragment stage, where it costs no varying.
  const boxPack = vec4(center, anchor.toFloat()).toVarying('vBoxPack');
  const radiusPack = vec4(radius, anchorRadius.y).toVarying('vRadiusPack');
  const anchorPack = vec4(anchorCenter, anchorRadius.z).toVarying(
    'vAnchorPack'
  );

  const box = {
    anchorCenter: anchorPack.xyz,
    anchorId: uint(boxPack.w.round()),
    anchorRadiusYZ: { y: radiusPack.w, z: anchorPack.w },
    center: boxPack.xyz,
    radius: radiusPack.xyz,
  };

  const colors = createColorNodes({ paletteTexture, uniforms: u.color });
  const surface = createSurfaceNodes({ maps, uniforms: u.surface });
  const windows = createWindowNodes({ box, uniforms: u.windows });

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.positionNode = positionGeometry.mul(radius).add(center);
  material.colorNode = windows.applyColor(
    surface.applyAlbedo(colors.boxColor(box))
  );
  material.normalNode = surface.normalView;
  material.roughnessNode = windows.applyRoughness(surface.roughness);
  material.emissiveNode = windows.emissive(colors.buildingColor(box.anchorId));

  return {
    material,
    setMaps: surface.setMaps,
    setPalette: colors.setPalette,
  };
}
