import {
  float,
  hash,
  mat3,
  mix,
  normalLocal,
  positionLocal,
  select,
  smoothstep,
  texture,
  transformNormalToView,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import unitToFieldUV from './fieldSample';

// Grains are cubes. TheSpeedOfLightning scaled them 0.62 x 1 x 0.44 because an
// elongated silhouette reads as sand from its low camera; here the default view
// is straight down, so that slab presents its 0.62 x 0.44 face and every grain
// looks like a rectangle. 0.65 is the cube root of that box's volume, so
// squaring them up doesn't also make the bed coarser.
const CUBE_ASPECT = 0.65;

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

// Rodrigues rotation about an arbitrary axis, columns first for mat3().
function axisAngleMatrix(axis, angle) {
  const c = angle.cos();
  const s = angle.sin();
  const t = c.oneMinus();
  const { x, y, z } = axis;

  return mat3(
    vec3(
      t.mul(x).mul(x).add(c),
      t.mul(x).mul(y).add(s.mul(z)),
      t.mul(x).mul(z).sub(s.mul(y))
    ),
    vec3(
      t.mul(x).mul(y).sub(s.mul(z)),
      t.mul(y).mul(y).add(c),
      t.mul(y).mul(z).add(s.mul(x))
    ),
    vec3(
      t.mul(x).mul(z).add(s.mul(y)),
      t.mul(y).mul(z).sub(s.mul(x)),
      t.mul(z).mul(z).add(c)
    )
  );
}

// Grains are static dressing over a dynamic field, not a simulation: home xz
// and burial (bedLayout.js) never change, and the reaction-diffusion field
// texture — sampled live here — is the only thing that moves. The field's
// shaped output texture keeps a fixed identity across frames, so this binds it
// once; the ping-ponging all happens upstream of it.
export default function createGrainMaterial({
  buffers,
  fieldTexel,
  fieldTexture,
  paletteTexture,
  uniforms,
}) {
  const home = buffers.home.toAttribute();
  const rot = buffers.rot.toAttribute();
  const seed = rot.w;

  const fieldUV = unitToFieldUV(home.x, home.z);
  // One fetch, both channels: .r is the shaped reaction field driving height
  // and culling, .g the colour coordinate the sim advects along with it.
  const fieldSample = texture(fieldTexture, fieldUV);
  const fieldValue = fieldSample.r;
  const colorValue = fieldSample.g;

  // Differencing the field gives the local surface slope. Grains lie along that
  // slope rather than all pointing the same way, so as the pattern flows past
  // each one tips through the passing gradient — heaving the bed up and down
  // alone reads as rigid, because nothing on the surface turns.
  //
  // Forward differences rather than central: they reuse the sample the height
  // already needs, so the slope costs two extra texture fetches per vertex
  // instead of four. Every vertex of an instance resolves the same uv, so these
  // are redundant 24 times over — if it ever shows up in a profile, the fix is
  // a compute pass writing height and slope once per instance.
  const stepUV = float(fieldTexel);
  const slopeX = texture(fieldTexture, fieldUV.add(vec2(stepUV, 0))).r.sub(
    fieldValue
  );
  const slopeZ = texture(fieldTexture, fieldUV.add(vec2(0, stepUV))).r.sub(
    fieldValue
  );
  // Horizontal axis perpendicular to the downhill direction — tipping about it
  // is the grain falling downhill. The clamped length keeps the divide (and so
  // the axis) finite where the field is flat; the angle is zero there anyway.
  const slopeLength = vec2(slopeX, slopeZ).length().max(1e-6);
  const rollAxis = vec3(slopeZ.negate(), 0, slopeX).div(slopeLength);
  const rollAngle = slopeLength
    .mul(uniforms.grainRoll)
    .mul(mix(float(0.7), float(1.3), seed));
  const roll = axisAngleMatrix(rollAxis, rollAngle);

  const restY = uniforms.bedBaseY
    .add(fieldValue.mul(uniforms.fieldHeightScale))
    .sub(home.w.mul(uniforms.bedThickness));

  // Cull is the same field value that drives height — the pattern itself
  // decides where sand exists at all, so gaps in the "Thin Spread" preset
  // trace the reaction-diffusion shape rather than looking like a separate
  // random mask.
  const cullMask = select(
    uniforms.cullEnabled.greaterThan(0.5),
    smoothstep(
      uniforms.cullThreshold.sub(uniforms.cullSoftness),
      uniforms.cullThreshold.add(uniforms.cullSoftness),
      fieldValue
    ),
    float(1)
  );

  const rotation = roll.mul(rotationMatrix(rot.xyz));

  // `seed` is uniform in 0..1, so `grainSizeCoarse` is literally the fraction
  // of grains that take part in the ramp up to max — everything below sits at
  // min. At 1 every grain participates and the result is an even min..max
  // ramp; at 0.02 the bed is 98% fine sand with 2% coarse grains climbing to
  // max. A power curve was the obvious way to shape this and it's a bad
  // control: at any usable exponent thousands of grains still land near the
  // top, so raising the ceiling reads as the whole bed scaling up rather than
  // as a few big grains appearing.
  const coarseFraction = uniforms.grainSizeCoarse.max(1e-4);
  const sizeMix = seed
    .sub(coarseFraction.oneMinus())
    .div(coarseFraction)
    .clamp(0, 1);
  const jitter = mix(uniforms.grainSizeMin, uniforms.grainSizeMax, sizeMix);
  const grainScale = uniforms.grainSize
    .mul(jitter)
    .mul(vec3(CUBE_ASPECT, CUBE_ASPECT, CUBE_ASPECT))
    .mul(cullMask);

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0.05,
    roughness: 0.92,
  });

  material.positionNode = rotation
    .mul(positionLocal.mul(grainScale))
    .add(
      vec3(
        home.x.mul(uniforms.bedRadius),
        restY,
        home.z.mul(uniforms.bedRadius)
      )
    );
  material.normalNode = transformNormalToView(
    rotation.mul(normalLocal).normalize()
  );

  // Real sand is a mix of discrete minerals, not one tinted powder — mirrors
  // TheSpeedOfLightning's grainMaterial.js palette pick.
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

  const sand = mix(uniforms.grainColor, mineral, uniforms.grainPaletteMix).mul(
    mix(float(0.82), float(1.18), seed)
  );

  // Height alone barely reads from straight overhead — you're looking down the
  // axis the relief varies along, and the shading a steep key light gives it is
  // weak. Tinting by the same field value is what makes the pattern legible
  // from above, the way the reference shader's Image pass colours by field.
  // Inverted to keep that shader's polarity: low field goes dark, high field
  // stays bright sand.
  const tinted = mix(
    sand,
    uniforms.fieldTintColor,
    fieldValue.oneMinus().mul(uniforms.fieldTint)
  );

  // `paletteAdvect` picks what the palette is read by. At 0 it's the shaped
  // field, so colour is a function of height and simply moves with the
  // pattern. At 1 it's the advected colour coordinate, which is carried
  // bodily through the flow — colours smear, fold and mix along the
  // streamlines instead of being recomputed from the shape every frame.
  // Not clamped: the palette texture wraps mirrored, so shifting the
  // coordinate off either end folds back through the gradient instead of
  // hitting a hard seam where the last stop meets the first.
  const paletteCoord = mix(fieldValue, colorValue, uniforms.paletteAdvect).add(
    uniforms.paletteShift
  );
  const paletteTextureNode = texture(paletteTexture, vec2(paletteCoord, 0.5));

  material.colorNode = mix(tinted, paletteTextureNode.rgb, uniforms.paletteMix);

  return { material, paletteTextureNode };
}
