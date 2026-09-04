import {
  float,
  hash,
  mat3,
  mix,
  normalLocal,
  positionLocal,
  select,
  smoothstep,
  transformNormalToView,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

function rotationMatrix(euler) {
  const a = euler.x.cos();
  const b = euler.x.sin();
  const c = euler.y.cos();
  const d = euler.y.sin();
  const e = euler.z.cos();
  const f = euler.z.sin();

  return mat3(
    vec3(
      c.mul(e),
      a.mul(f).add(b.mul(e).mul(d)),
      b.mul(f).sub(a.mul(e).mul(d))
    ),
    vec3(
      c.mul(f).negate(),
      a.mul(e).sub(b.mul(f).mul(d)),
      b.mul(e).add(a.mul(f).mul(d))
    ),
    vec3(d, b.negate().mul(c), a.mul(c))
  );
}

export default function createGrainMaterial({ buffers, uniforms }) {
  const posRole = buffers.posRole.toAttribute();
  const velLife = buffers.velLife.toAttribute();
  const boltTarget = buffers.boltTarget.toAttribute();
  const grainRot = buffers.grainRot.toAttribute();
  const boltParent = buffers.boltParent.toAttribute();

  const role = posRole.w;
  const life = velLife.w;
  const arc = boltTarget.w;
  const seed = grainRot.w;
  const branchDepth = boltParent.w;

  const isBolt = role.greaterThan(0.5).and(role.lessThan(1.5));
  const isFree = role.greaterThan(1.5).and(role.lessThan(2.5));
  const boltMask = select(isBolt, float(1), float(0));

  const behindTip = uniforms.frontArc.sub(arc);
  const emerge = behindTip.div(uniforms.emergeArc).clamp(0, 1);

  const spin = float(1)
    .sub(emerge)
    .mul(boltMask)
    .mul(Math.PI * 1.5);
  const rotation = rotationMatrix(
    grainRot.xyz.add(vec3(spin, spin.mul(0.6), spin.mul(1.4)))
  );

  // Skinny cubes, not spheres — the silhouette is what makes a grain read as
  // sand rather than a blurred dot.
  const jitter = mix(float(0.55), float(1.45), seed);
  const reveal = select(isBolt, smoothstep(0, 0.4, emerge), float(1));
  const grainScale = uniforms.grainSize
    .mul(jitter)
    .mul(vec3(0.62, 1, 0.44))
    .mul(reveal);

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0.05,
    roughness: 0.92,
  });

  material.positionNode = rotation
    .mul(positionLocal.mul(grainScale))
    .add(posRole.xyz);
  material.normalNode = transformNormalToView(
    rotation.mul(normalLocal).normalize()
  );
  // Real sand is a mix of discrete minerals, not one tinted powder, so grains
  // pick a whole colour rather than blending toward one. The pick is hashed off
  // `seed` rather than reusing it, or colour would correlate with grain size.
  // `grainPaletteMix` at 0 collapses the palette back to grainColor, which is
  // what every preset authored before this existed expects.
  const pick = hash(seed.mul(65536).add(17));
  const mineral = select(
    pick.lessThan(uniforms.grainPaletteSplitB),
    uniforms.grainColor,
    select(
      pick.lessThan(uniforms.grainPaletteSplitC),
      uniforms.grainColorB,
      uniforms.grainColorC
    )
  );

  material.colorNode = mix(
    uniforms.grainColor,
    mineral,
    uniforms.grainPaletteMix
  ).mul(mix(float(0.82), float(1.18), seed));

  // Built as a plain expression chain, not inside an Fn(): nodes captured by an
  // Fn closure build fine headlessly but emit `unresolved value` WGSL.
  const tip = behindTip
    .max(0)
    .div(uniforms.tipFalloff)
    .negate()
    .exp()
    .mul(boltMask)
    .mul(uniforms.tipActive);
  // The return stroke only travels the trunk — that is the ionised path to
  // ground. Branches are dead ends, so letting the pulse light them made
  // unrelated branches flash in sequence as it swept past their arc value.
  const onTrunk = select(
    branchDepth.lessThan(0.5),
    float(1),
    uniforms.returnBranchGlow
  );
  const returnPulse = arc
    .sub(uniforms.returnArc)
    .abs()
    .div(uniforms.returnWidth)
    .negate()
    .exp()
    .mul(uniforms.returnStrength)
    .mul(boltMask)
    .mul(onTrunk);
  const ejecta = select(
    isFree,
    life.clamp(0, 1).mul(uniforms.ejectaGlow),
    float(0)
  );
  const heat = tip
    .add(returnPulse)
    .add(uniforms.channelFlash.mul(boltMask).mul(onTrunk))
    .add(uniforms.channelGlow.mul(boltMask))
    .add(ejecta);

  material.emissiveNode = mix(
    uniforms.leaderColor,
    uniforms.returnColor,
    heat.clamp(0, 1)
  ).mul(heat.mul(uniforms.emissiveStrength));

  return material;
}
