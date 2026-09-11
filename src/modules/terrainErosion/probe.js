import { float, select, uniform, vec4 } from 'three/tsl';

// Reshapes a baked erosion field into the height-and-slope query a particle
// simulation wants, with the same two-function surface an analytic wave probe
// exposes: where the surface is under a world XZ, and which way it tilts.
export default function createErosionProbe({
  extent = 140,
  baseHeight = 0.45,
  heightScale = 40,
  sampling,
}) {
  const uniforms = {
    base: uniform(baseHeight),
    extent: uniform(extent),
    scale: uniform(heightScale),
  };

  const toField = (worldXZ) => worldXZ.div(uniforms.extent);

  const worldHeight = (fieldUV) =>
    sampling.sampleHeight(fieldUV).sub(uniforms.base).mul(uniforms.scale);

  // Coverage has to be forced to zero beyond the footprint. Clamp-to-edge would
  // otherwise smear the border texels outwards, which reads as an endless
  // invisible shelf rather than the edge of a mountain.
  return {
    sample: (worldXZ) => {
      const local = toField(worldXZ).toVar();
      const inside = local.abs().toVar();
      const height = worldHeight(sampling.toFieldUV(local)).toVar();

      return vec4(
        worldXZ.x,
        height,
        worldXZ.y,
        select(inside.x.max(inside.y).lessThan(0.5), float(1), float(0))
      );
    },

    slope: (worldXZ) =>
      sampling
        .sampleSlope(sampling.toFieldUV(toField(worldXZ)))
        .mul(uniforms.scale)
        .div(uniforms.extent),

    uniforms,
  };
}
