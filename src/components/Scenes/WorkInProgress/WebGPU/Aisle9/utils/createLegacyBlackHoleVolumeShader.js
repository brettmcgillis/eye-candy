import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  asin,
  atan,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  int,
  length,
  max,
  mix,
  modelViewMatrix,
  modelWorldMatrixInverse,
  normalize,
  positionGeometry,
  pow,
  sign,
  sin,
  smoothstep,
  sqrt,
  struct,
  texture as textureSample,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { blackbodyColor, fbm } from './blackHoleShaderHelpers';

const MAX_LEGACY_STEPS = 256;
const TWO_PI = Math.PI * 2;

const LegacyBlackHoleResult = struct(
  { color: 'vec4', depth: 'float' },
  'Aisle9LegacyBlackHoleResult'
);

// ACES filmic tone mapping — preserves color saturation through HDR highlights
const acesTonemap = Fn(([x]) => {
  const a = float(2.51);
  const b = float(0.03);
  const c = float(2.43);
  const d = float(0.59);
  const e = float(0.14);
  const numerator = x.mul(x.mul(a).add(b));
  const denominator = x.mul(x.mul(c).add(d)).add(e);
  return clamp(numerator.div(denominator), float(0), float(1));
});

function createLegacyDiskColor(uniforms) {
  return Fn(
    ([hitPosition, hitRadius, hitAngle, rayDirection, diskTextureNode]) => {
      const normalizedRadius = clamp(
        hitRadius
          .sub(uniforms.innerRadius)
          .div(uniforms.outerRadius.sub(uniforms.innerRadius)),
        float(0),
        float(1)
      );

      // Shared Doppler physics used by both paths
      const diskVelocity = vec3(hitPosition.z.negate(), float(0), hitPosition.x)
        .div(sqrt(max(hitRadius.sub(1), float(0.001))))
        .div(max(hitRadius.mul(hitRadius), float(0.001)));
      const gamma = float(1).div(
        sqrt(max(float(1).sub(dot(diskVelocity, diskVelocity)), float(0.001)))
      );
      const doppler = gamma.mul(
        float(1).add(dot(normalize(rayDirection), diskVelocity))
      );

      const outColor = vec3(0, 0, 0).toVar('diskOutColor');
      const outOpacity = float(0).toVar('diskOutOpacity');

      If(uniforms.useProceduralDisk.greaterThan(float(0.5)), () => {
        // ── PROCEDURAL PATH ────────────────────────────────────────────────────

        // Radial temperature gradient: T(r) ∝ (r_inner/r)^0.75
        // Inner edge: hot (blue-white), outer edge: cool (deep orange-red)
        const radialGradient = pow(
          uniforms.innerRadius.div(
            max(hitRadius, uniforms.innerRadius.mul(float(0.9)))
          ),
          float(0.75)
        );
        // Doppler shifts temperature: approaching gas is blueshifted, receding is redshifted
        const dopplerTempShift = pow(
          max(doppler, float(0.1)),
          uniforms.dopplerStrength.negate()
        );
        const temperature = uniforms.diskTemperature
          .mul(radialGradient)
          .mul(dopplerTempShift);

        // Differential Keplerian rotation: inner gas orbits faster (ω ∝ r^-3/2)
        const angularFlow = uniforms.time
          .mul(float(0.25))
          .div(pow(max(hitRadius, float(0.5)), float(1.5)));
        const flowAngle = hitAngle.add(angularFlow);

        // FBM in co-rotating disk coordinates for swirling gas lane structure
        const noiseCoord = vec3(
          cos(flowAngle).mul(normalizedRadius).mul(float(5.0)),
          sin(flowAngle).mul(normalizedRadius).mul(float(5.0)),
          uniforms.time.mul(float(0.04))
        );
        const rawNoise = fbm(noiseCoord, float(2.2), float(0.55));
        // Remap into high-contrast filaments with dark gaps
        const filaments = clamp(
          rawNoise.mul(float(2.5)).sub(float(0.35)),
          float(0),
          float(1)
        );

        // Edge masks: sharp inner transition, gradual outer fade
        const innerFade = smoothstep(float(0), float(0.07), normalizedRadius);
        const outerFade = smoothstep(float(1), float(0.55), normalizedRadius);
        const diskMask = innerFade.mul(outerFade);

        // Blend filaments with a base floor so disk has persistent presence
        const structuredDensity = mix(filaments, float(1), float(0.2)).mul(
          diskMask
        );

        // ISCO emission ring: intense narrow gaussian at the innermost stable orbit
        const iscoNorm = normalizedRadius.div(float(0.1));
        const iscoRing = exp(iscoNorm.negate().mul(iscoNorm)).mul(float(5.0));
        const iscoTemp = clamp(
          uniforms.diskTemperature.mul(float(2.0)),
          float(1000),
          float(40000)
        );

        // Relativistic beaming: approaching side is dramatically brighter
        const beaming = float(1).div(
          max(
            pow(doppler, uniforms.dopplerStrength.mul(float(4))),
            float(0.001)
          )
        );

        const mainColor = blackbodyColor(
          clamp(temperature, float(1000), float(40000))
        )
          .mul(structuredDensity)
          .mul(uniforms.diskBrightness)
          .mul(beaming);

        // ISCO ring also gets beaming so approaching side glows harder
        const iscoColor = blackbodyColor(iscoTemp)
          .mul(iscoRing)
          .mul(uniforms.diskBrightness)
          .mul(beaming);

        outColor.assign(mainColor.add(iscoColor));
        outOpacity.assign(
          clamp(
            structuredDensity
              .add(iscoRing.mul(float(0.4)))
              .mul(uniforms.diskBrightness)
              .mul(beaming),
            float(0),
            float(1)
          )
        );
      }).Else(() => {
        // ── ORIGINAL TEXTURE PATH ──────────────────────────────────────────────

        const temperature = uniforms.diskTemperature.div(
          max(float(0.2), doppler.pow(uniforms.dopplerStrength))
        );
        const diskSample = textureSample(
          diskTextureNode,
          vec2(normalizedRadius, hitAngle.div(float(TWO_PI)).add(0.5))
        );
        const beaming = float(1).div(
          max(doppler.pow(uniforms.dopplerStrength.mul(3)), float(0.001))
        );
        const diskColor = diskSample.rgb
          .mul(blackbodyColor(temperature))
          .mul(uniforms.diskBrightness)
          .mul(beaming);
        const opacity = clamp(
          diskSample.a.mul(uniforms.diskBrightness).mul(beaming),
          float(0),
          float(1)
        );
        outColor.assign(diskColor);
        outOpacity.assign(opacity);
      });

      return vec4(outColor, outOpacity);
    }
  );
}

function createLegacyBackground(uniforms) {
  return Fn(([rayDirection, galaxyTextureNode, starTextureNode]) => {
    const rotation = float(Math.PI / 4);
    const rotatedDirection = vec3(
      rayDirection.x
        .mul(rotation.cos())
        .sub(rayDirection.z.mul(rotation.sin())),
      rayDirection.y,
      rayDirection.x.mul(rotation.sin()).add(rayDirection.z.mul(rotation.cos()))
    );
    const uv = vec2(
      atan(rotatedDirection.x, rotatedDirection.z).div(float(TWO_PI)).add(0.5),
      asin(clamp(rotatedDirection.y, float(-1), float(1)))
        .div(float(Math.PI))
        .add(0.5)
    );
    const starSample = textureSample(starTextureNode, uv);
    const starTemperature = float(4000).add(starSample.g.mul(11000));
    const starColor = blackbodyColor(starTemperature)
      .mul(starSample.r)
      .mul(uniforms.starBrightness);
    const galaxyColor = textureSample(galaxyTextureNode, uv).rgb.mul(
      uniforms.galaxyBrightness
    );

    return galaxyColor.add(starColor);
  });
}

export default function createLegacyBlackHoleVolumeShader(
  uniforms,
  { diskTextureNode, galaxyTextureNode, starTextureNode }
) {
  const diskColor = createLegacyDiskColor(uniforms);
  const backgroundColor = createLegacyBackground(uniforms);

  return Fn(() => {
    const simScale = float(1).div(max(uniforms.coreRadius, float(0.0001)));
    const cameraLocal = modelWorldMatrixInverse.mul(
      vec4(cameraPosition, 1)
    ).xyz;
    const fragmentLocal = positionGeometry;
    const rayStart = mix(fragmentLocal, cameraLocal, uniforms.cameraInside)
      .mul(simScale)
      .toVar('rayStart');
    const rayDirection = normalize(fragmentLocal.sub(cameraLocal)).toVar(
      'rayDirection'
    );
    const previousPosition = rayStart.toVar('previousPosition');
    const simPosition = rayStart.toVar('simPosition');
    const lastDirection = rayDirection.toVar('lastDirection');
    const color = vec3(0, 0, 0).toVar('color');
    const alpha = float(0).toVar('alpha');
    const escaped = float(0).toVar('escaped');
    const captured = float(0).toVar('captured');
    const hitRecorded = float(0).toVar('hitRecorded');
    const hitLocal = vec3(0, 0, 0).toVar('hitLocal');

    const normalVector = normalize(simPosition).toVar('normalVector');
    const tangentBase = cross(cross(normalVector, rayDirection), normalVector);
    const tangentLength = max(length(tangentBase), float(0.0001));
    const tangentVector = tangentBase.div(tangentLength).toVar('tangentVector');
    const u = float(1)
      .div(max(length(simPosition), float(0.0001)))
      .toVar('u');
    const tangentDot = dot(rayDirection, tangentVector).toVar('tangentDot');
    const du = rayDirection
      .mul(-1)
      .dot(normalVector)
      .div(max(abs(tangentDot), float(0.0001)).mul(sign(tangentDot)))
      .mul(u)
      .toVar('du');
    const phi = float(0).toVar('phi');

    Loop(
      {
        start: int(0),
        end: int(MAX_LEGACY_STEPS),
        type: 'int',
        condition: '<',
      },
      ({ i }) => {
        If(i.greaterThanEqual(uniforms.stepCount), () => {
          Break();
        });

        If(
          escaped
            .greaterThan(0.5)
            .or(captured.greaterThan(0.5))
            .or(alpha.greaterThan(0.99)),
          () => {
            Break();
          }
        );

        const radius = float(1).div(max(u, float(0.0001)));
        If(u.greaterThan(1), () => {
          If(hitRecorded.lessThan(0.5), () => {
            hitLocal.assign(simPosition.mul(uniforms.coreRadius));
            hitRecorded.assign(1);
          });
          captured.assign(1);
          Break();
        });

        If(radius.greaterThan(uniforms.simBoundary), () => {
          escaped.assign(1);
          Break();
        });

        const baseStep = uniforms.maxRevolutions
          .mul(float(TWO_PI))
          .div(uniforms.stepCount.toFloat());
        const adaptiveStep = baseStep.mul(
          clamp(radius.div(uniforms.simBoundary), float(0.08), float(1))
        );

        previousPosition.assign(simPosition);
        u.addAssign(du.mul(adaptiveStep));

        If(u.lessThan(0), () => {
          escaped.assign(1);
          Break();
        });

        const acceleration = u
          .mul(float(-1))
          .mul(float(1).sub(u.mul(u).mul(1.5)));
        du.addAssign(
          acceleration.mul(adaptiveStep).mul(uniforms.gravityStrength)
        );
        phi.addAssign(adaptiveStep);

        simPosition.assign(
          normalVector
            .mul(cos(phi))
            .add(tangentVector.mul(sin(phi)))
            .div(u)
        );
        lastDirection.assign(normalize(simPosition.sub(previousPosition)));

        const crossedPlane = previousPosition.y.mul(simPosition.y).lessThan(0);
        If(
          crossedPlane.and(alpha.lessThan(0.99)).and(captured.lessThan(0.5)),
          () => {
            const t = previousPosition.y
              .negate()
              .div(simPosition.y.sub(previousPosition.y));
            const hitPosition = mix(previousPosition, simPosition, t);
            const hitRadius = sqrt(
              hitPosition.x
                .mul(hitPosition.x)
                .add(hitPosition.z.mul(hitPosition.z))
            );
            const inDisk = hitRadius
              .greaterThan(uniforms.innerRadius)
              .and(hitRadius.lessThan(uniforms.outerRadius));

            If(inDisk, () => {
              const hitAngle = atan(hitPosition.z, hitPosition.x);
              const diskResult = diskColor(
                hitPosition,
                hitRadius,
                hitAngle,
                lastDirection,
                diskTextureNode
              );
              const remainingAlpha = float(1).sub(alpha);
              color.addAssign(
                diskResult.xyz.mul(diskResult.w).mul(remainingAlpha)
              );
              alpha.addAssign(remainingAlpha.mul(diskResult.w));

              If(
                hitRecorded.lessThan(0.5).and(diskResult.w.greaterThan(0.04)),
                () => {
                  hitLocal.assign(hitPosition.mul(uniforms.coreRadius));
                  hitRecorded.assign(1);
                }
              );
            });
          }
        );
      }
    );

    If(captured.lessThan(0.5), () => {
      escaped.assign(1);
    });

    If(
      uniforms.useBackground.greaterThan(0.5).and(alpha.lessThan(0.99)),
      () => {
        color.addAssign(
          backgroundColor(
            lastDirection,
            galaxyTextureNode,
            starTextureNode
          ).mul(float(1).sub(alpha))
        );
      }
    );

    const finalAlpha = mix(
      captured.max(alpha),
      float(1),
      uniforms.useBackground
    );
    const straightColor = color.div(max(finalAlpha, float(0.0001)));

    // Procedural path uses ACES filmic; original texture path uses gamma to match original look
    const acesResult = acesTonemap(straightColor);
    const gammaResult = pow(straightColor, vec3(1 / 2.2));
    const finalColor = mix(gammaResult, acesResult, uniforms.useProceduralDisk);

    const depthValue = float(1).toVar('depthValue');

    If(hitRecorded.greaterThan(0.5), () => {
      const clipPosition = cameraProjectionMatrix.mul(
        modelViewMatrix.mul(vec4(hitLocal, 1))
      );
      depthValue.assign(clipPosition.z.div(clipPosition.w));
    });

    return LegacyBlackHoleResult(vec4(finalColor, finalAlpha), depthValue);
  })();
}
