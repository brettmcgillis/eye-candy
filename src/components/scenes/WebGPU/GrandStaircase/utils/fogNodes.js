/* eslint-disable camelcase */
import {
  Fn,
  Loop,
  atan,
  cameraPosition,
  cameraProjectionMatrixInverse,
  cameraWorldMatrix,
  clamp,
  float,
  getViewPosition,
  int,
  interleavedGradientNoise,
  ivec2,
  max,
  mx_noise_float,
  oneMinus,
  screenCoordinate,
  screenUV,
  smoothstep,
  textureLoad,
  vec3,
  vec4,
} from 'three/tsl';

import { MAX_FLARES } from './landings';
import { sampleSlice } from './profileNodes';

export default function buildFogComposite({
  sceneColor,
  sceneDepth,
  shaft,
  uniforms,
}) {
  const shaftUniforms = shaft.uniforms;

  return Fn(() => {
    const depth = sceneDepth.sample(screenUV).r;
    const viewPosition = getViewPosition(
      screenUV,
      depth,
      cameraProjectionMatrixInverse
    );
    const worldPosition = cameraWorldMatrix.mul(vec4(viewPosition, 1)).xyz;
    const toSurface = worldPosition.sub(cameraPosition).toVar();
    const sceneDistance = toSurface.length().toVar();
    const direction = toSurface.div(max(sceneDistance, 0.001)).toVar();
    const tMax = sceneDistance.min(uniforms.fogMaxDistance).toVar();
    const stepLength = tMax.div(float(uniforms.fogSteps)).toVar();

    const t = stepLength
      .mul(interleavedGradientNoise(screenCoordinate))
      .toVar();
    const transmittance = float(1).toVar();
    const inscatter = vec3(0).toVar();

    Loop(uniforms.fogSteps, () => {
      const point = cameraPosition.add(direction.mul(t)).toVar();
      const s = clamp(
        shaftUniforms.aboveCamera.sub(point.y),
        0,
        shaftUniforms.windowDepth
      );
      const column = sampleSlice(
        shaft.lightTexture,
        s,
        shaftUniforms.windowDepth,
        shaftUniforms.sliceCount
      );
      const outer = max(column.z, 0.05);
      const inner = outer.mul(oneMinus(uniforms.shaftEdge));
      const visibility = oneMinus(
        smoothstep(inner, outer, point.xz.sub(column.xy).length())
      );

      const noise = mx_noise_float(
        vec3(point.x, shaftUniforms.descent.sub(point.y), point.z).mul(
          uniforms.fogNoiseScale
        )
      );
      const density = uniforms.fogDensity.mul(
        float(1).add(uniforms.fogNoiseAmount.mul(noise))
      );
      const extinction = max(density.mul(stepLength), 0);

      inscatter.addAssign(
        uniforms.shaftColor
          .mul(uniforms.shaftIntensity)
          .mul(column.w)
          .mul(visibility)
          .mul(extinction)
          .mul(transmittance)
      );
      transmittance.mulAssign(extinction.negate().exp());
      t.addAssign(stepLength);
    });

    const flareGlow = vec3(0).toVar();
    Loop(MAX_FLARES, ({ i }) => {
      const flare = textureLoad(shaft.flareTexture, ivec2(int(i), int(0)));
      const toFlare = flare.xyz.sub(cameraPosition);
      const along = clamp(toFlare.dot(direction), 0, tMax);
      const perpendicular = max(
        toFlare.sub(direction.mul(along)).length(),
        0.15
      );
      const integral = atan(tMax.sub(along).div(perpendicular))
        .sub(atan(along.negate().div(perpendicular)))
        .div(perpendicular);
      flareGlow.addAssign(
        uniforms.flareColor
          .mul(flare.w)
          .mul(integral)
          .mul(uniforms.flareScatter)
          .mul(uniforms.fogDensity)
          .mul(uniforms.fogDensity.mul(along).negate().exp())
      );
    });

    return sceneColor.rgb.mul(transmittance).add(inscatter).add(flareGlow);
  })();
}
