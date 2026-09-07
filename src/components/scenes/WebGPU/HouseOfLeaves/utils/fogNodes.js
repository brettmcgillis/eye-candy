/* eslint-disable camelcase */
import {
  Break,
  Fn,
  If,
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
  texture,
  textureLoad,
  vec3,
  vec4,
} from 'three/tsl';

import { MAX_FLARES } from './flares';

// Returns vec4(inscatter, transmittance) rather than a finished composite, so
// the march can run at reduced resolution and be combined with the full-res
// scene colour afterwards.
//
// The beam is marched, not approximated. A flashlight that lights the walls
// but not the air between them reads as a decal projected onto stone; what
// makes distance unresolvable is the light scattering back off the fog in
// front of the lamp, which is only visible if the volume knows about the cone.
export default function buildFogVolume({
  cookie,
  flareTexture,
  sceneDepth,
  uniforms,
}) {
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

    // Jittered start, or the march bands into visible shells around the lamp.
    const t = stepLength
      .mul(interleavedGradientNoise(screenCoordinate))
      .toVar();
    const transmittance = float(1).toVar();
    const inscatter = vec3(0).toVar();

    Loop(uniforms.fogSteps, () => {
      const point = cameraPosition.add(direction.mul(t)).toVar();

      // Into the lamp's own frame, where the cone is just a half-angle about
      // -Z and the cookie is a straight perspective divide.
      const local = uniforms.beamMatrix.mul(vec4(point, 1)).xyz.toVar();
      const forward = local.z.negate().toVar();
      const range = max(local.length(), 0.001);
      const cone = smoothstep(
        uniforms.beamCosOuter,
        uniforms.beamCosInner,
        forward.div(range)
      );
      const uv = local.xy
        .div(max(forward, 0.001).mul(uniforms.beamSpread))
        .mul(0.5)
        .add(0.5);
      const lens = texture(cookie, uv).r;
      const falloff = float(1).div(
        float(1).add(range.mul(range).mul(uniforms.beamFalloff))
      );
      // Written ascending and inverted: smoothstep with edge0 above edge1 is
      // undefined, and silently so on some backends.
      const reach = oneMinus(
        smoothstep(uniforms.beamRange.mul(0.55), uniforms.beamRange, range)
      );
      const beam = cone.mul(lens).mul(falloff).mul(reach);

      const noise = mx_noise_float(point.mul(uniforms.fogNoiseScale));
      const density = uniforms.fogDensity.mul(
        float(1).add(uniforms.fogNoiseAmount.mul(noise))
      );
      const extinction = max(density.mul(stepLength), 0);

      inscatter.addAssign(
        uniforms.beamColor
          .mul(uniforms.beamScatter)
          .mul(beam)
          .mul(extinction)
          .mul(transmittance)
      );
      transmittance.mulAssign(extinction.negate().exp());
      t.addAssign(stepLength);
    });

    // Flares are integrated along the whole ray in closed form rather than
    // sampled at the march's steps. A small bright source a long way off falls
    // between 24 steps and flickers as the camera moves; the integral of
    // 1/(d² + s²) along the ray has no such gaps and costs one atan pair.
    const flareGlow = vec3(0).toVar();
    Loop(MAX_FLARES, ({ i }) => {
      const flare = textureLoad(flareTexture, ivec2(int(i), int(0)));
      // Packed from index 0 with no gaps, so the first empty slot ends it.
      If(flare.w.lessThanEqual(0), () => {
        Break();
      });
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
          // Extinction between the flare and the eye, or a flare behind a wall
          // lights the fog in front of it.
          .mul(uniforms.fogDensity.mul(along).negate().exp())
      );
    });

    return vec4(inscatter.add(flareGlow), transmittance);
  })();
}
