import {
  Fn,
  attribute,
  float,
  instanceIndex,
  mix,
  normalGeometry,
  positionGeometry,
  varyingProperty,
} from 'three/tsl';

import { VOXEL_BLOCK } from '@modules/fauna';

import {
  legFrame,
  slotNodes,
  smoothSkin,
  standardMaterial,
  toViewNormal,
  toWorld,
} from './creatureNodes';

export default function createVoxelMaterial(store, u) {
  const material = standardMaterial(u);
  const color = varyingProperty('vec3', 'vVoxelColor');
  const normal = varyingProperty('vec3', 'vVoxelNormal');
  const rough = varyingProperty('float', 'vVoxelRough');

  const position = Fn(() => {
    const slot = slotNodes(store, instanceIndex.div(VOXEL_BLOCK));
    const local = attribute('vLocal', 'vec4');
    const info = attribute('vInfo', 'vec4');
    const frame = legFrame(slot);
    const mask = info.x;
    const inFrame = mask
      .lessThan(-0.5)
      .select(
        float(0),
        mask
          .lessThan(0.5)
          .select(float(1), mask.sub(1).equal(frame).select(float(1), float(0)))
      );
    const visible = inFrame.mul(smoothSkin(u, slot).oneMinus());
    const role = info.y;
    const bodyColor = mix(
      slot.base.rgb,
      slot.accent.rgb,
      role.equal(1).select(float(1), float(0))
    );
    const shade = info.z.mul(-0.18).add(1.05);

    color.assign(
      mix(
        bodyColor,
        slot.base.rgb.mul(0.62),
        role.equal(2).select(float(1), float(0))
      ).mul(shade)
    );
    normal.assign(toViewNormal(normalGeometry, slot));
    rough.assign(slot.base.w);

    const cube = positionGeometry.mul(local.w).mul(u.voxelFill);

    return toWorld(local.xyz.add(cube).mul(visible), slot);
  })();

  material.positionNode = position;
  material.colorNode = color;
  material.normalNode = normal;
  material.roughnessNode = rough.mul(u.roughness).clamp(0.05, 1);

  return material;
}
