import {
  Fn,
  If,
  Loop,
  attribute,
  cos,
  float,
  floor,
  mix,
  mod,
  normalGeometry,
  normalize,
  positionGeometry,
  pow,
  sin,
  smoothstep,
  time,
  varyingProperty,
  vec3,
} from 'three/tsl';

import { MAX_IFS_LEVELS } from '@modules/fauna';

import {
  legFrame,
  slotNodes,
  smoothSkin,
  standardMaterial,
  toViewNormal,
  toWorld,
} from './creatureNodes';

function bit(mask, k) {
  return mod(floor(mask.div(pow(2, k))), 2);
}

function unfold(bone, local, restNormal, slot, t) {
  const falloff = slot.ifsA.w;
  const range = slot.ifsA.y;
  const balance = slot.ifsB.x;
  const flipMask = slot.swimB.w;
  const p = local.toVar();
  const n = restNormal.toVar();

  Loop(MAX_IFS_LEVELS, ({ i }) => {
    const k = bone.y.sub(float(i));

    If(k.greaterThanEqual(0), () => {
      const a = pow(falloff, k.negate());
      const swing = balance.mul(bit(flipMask, k).mul(-2).add(1)).div(a);
      const azy = sin(t).mul(swing).add(a.mul(2));
      const axy = cos(t).mul(swing).add(a.mul(2));
      const reflect = bit(bone.x, k).mul(-2).add(1);
      const cz = cos(azy);
      const sz = sin(azy);
      const cx = cos(axy);
      const sx = sin(axy);
      const undo = (v, offset) => {
        const z0 = cz.mul(v.z).add(sz.mul(v.y));
        const y0 = sz.negate().mul(v.z).add(cz.mul(v.y));
        const x1 = cx.mul(v.x).add(sx.mul(y0));
        const y1 = sx.negate().mul(v.x).add(cx.mul(y0));

        return vec3(x1.add(offset).mul(reflect), y1, z0);
      };

      p.assign(undo(p, range.mul(a)));
      n.assign(undo(n, float(0)));
    });
  });

  return { n, p };
}

export function createBlobMaterial(store, u) {
  const material = standardMaterial(u);
  const color = varyingProperty('vec3', 'vBlobColor');
  const normal = varyingProperty('vec3', 'vBlobNormal');
  const rough = varyingProperty('float', 'vBlobRough');

  material.positionNode = Fn(() => {
    const slot = slotNodes(store, attribute('aSlot', 'float'));
    const boneA = attribute('aBoneA', 'vec4');
    const boneB = attribute('aBoneB', 'vec4');
    const t = slot.ifsB.y.add(
      slot.ifsB.z.mul(sin(time.mul(slot.ifsB.w).mul(1.6).add(slot.motion.w)))
    );
    const a = unfold(
      boneA,
      attribute('aLocalA', 'vec3'),
      normalGeometry,
      slot,
      t
    );
    const b = unfold(
      boneB,
      attribute('aLocalB', 'vec3'),
      normalGeometry,
      slot,
      t
    );
    const w = boneA.z;
    const skinned = mix(b.p, a.p, w);
    const local = skinned.sub(slot.blob.yzw).mul(slot.blob.x);
    const depth = boneA.y.div(slot.ifsA.x.sub(1).max(1));

    color.assign(
      mix(slot.base.rgb, slot.accent.rgb, smoothstep(0.25, 1, depth))
    );
    normal.assign(toViewNormal(normalize(mix(b.n, a.n, w)), slot));
    rough.assign(slot.base.w);

    return toWorld(local, slot);
  })();
  material.colorNode = color;
  material.normalNode = normal;
  material.roughnessNode = rough.mul(u.roughness).clamp(0.05, 1);

  return material;
}

export function createInvaderSkinMaterial(store, u) {
  const material = standardMaterial(u);
  const color = varyingProperty('vec3', 'vSkinColor');
  const normal = varyingProperty('vec3', 'vSkinNormal');
  const rough = varyingProperty('float', 'vSkinRough');

  material.positionNode = Fn(() => {
    const slot = slotNodes(store, attribute('aSlot', 'float'));
    const frame = attribute('aFrame', 'float');
    const visible = frame
      .sub(1)
      .equal(legFrame(slot))
      .select(float(1), float(0))
      .mul(smoothSkin(u, slot));
    const height = positionGeometry.y;

    color.assign(
      mix(slot.accent.rgb, slot.base.rgb, smoothstep(0.15, 0.4, height)).mul(
        smoothstep(0.3, 1.1, height).oneMinus().mul(0.15).add(0.92)
      )
    );
    normal.assign(toViewNormal(normalGeometry, slot));
    rough.assign(slot.base.w);

    return toWorld(positionGeometry.mul(visible), slot);
  })();
  material.colorNode = color;
  material.normalNode = normal;
  material.roughnessNode = rough.mul(u.roughness).clamp(0.05, 1);

  return material;
}
