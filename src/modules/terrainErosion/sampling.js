import { cross, texture, vec2, vec3 } from 'three/tsl';

// The reference computes normals here rather than in the height buffer, so a
// consumer pays two extra texture fetches instead of re-running the whole
// filter. Everything that reads the field goes through these.
export default function createFieldSampling({
  detailTexture,
  heightTexture,
  scrollFrac,
  texel,
}) {
  const height = texture(heightTexture);
  const detail = texture(detailTexture);

  const toFieldUV = (posXZ) =>
    posXZ
      .mul(texel.mul(2).oneMinus())
      .add(0.5)
      .clamp(texel, texel.oneMinus())
      .add(scrollFrac);

  const sampleHeight = (fieldUV) => height.sample(fieldUV).x;

  const sampleData = (fieldUV) => {
    const centre = height.sample(fieldUV).toVar();
    const alongX = height.sample(fieldUV.add(vec2(texel, 0))).x.toVar();
    const alongZ = height.sample(fieldUV.add(vec2(0, texel))).x.toVar();

    const v1 = vec3(texel, 0, alongX.sub(centre.x));
    const v2 = vec3(0, texel, alongZ.sub(centre.x));

    return {
      erosion: centre.y.mul(2).sub(1),
      height: centre.x,
      normal: cross(v1, v2).normalize().xzy,
      ridgemap: centre.z,
      trees: centre.w,
    };
  };

  // Central differences, not the forward pair the normal uses: a slope that is
  // read to slide something along the surface wants to be symmetric about the
  // query point, or every drop drifts half a texel downhill on flat ground.
  const sampleSlope = (fieldUV) => {
    const dx = texel.toVar();
    const right = height.sample(fieldUV.add(vec2(dx, 0))).x;
    const left = height.sample(fieldUV.sub(vec2(dx, 0))).x;
    const far = height.sample(fieldUV.add(vec2(0, dx))).x;
    const near = height.sample(fieldUV.sub(vec2(0, dx))).x;

    return vec2(right.sub(left), far.sub(near)).div(dx.mul(2));
  };

  return {
    detailAt: (fieldUV) => detail.sample(fieldUV),
    sampleData,
    sampleHeight,
    sampleSlope,
    toFieldUV,
  };
}
