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
  fwidth,
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

      // Shared Doppler physics used by procedural and texture paths
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

      If(uniforms.diskVariant.greaterThan(float(2.5)), () => {
        // ── RIBBON VARIANT ─────────────────────────────────────────────────────
        // Full port of legacyDiskShaderExample2.glsl (flat ribbon + shading).
        //
        // Step 1 — getColor(): multi-harmonic fcos palette
        //   p = abs(p)*1.25; p = 0.5*p/dot(p,p); t = 0.13*length(p)
        //   simplifies to t = 0.065 / length(abs(scaledPos)*1.25)
        //
        // Step 2 — shading: position-based normal tilt restores the red→blue
        //   gradient that flat (untwisted) ribbons otherwise lose. The normal
        //   is tilted radially outward from the disk centre, so the near side
        //   faces the light (blue/lit) and the far side faces away (red/unlit).
        //   This exactly mirrors the fix applied in legacyDiskShaderExample2.glsl.
        //
        // Step 3 — two squaring passes (brightness curve) from the original.

        // ── getColor ──────────────────────────────────────────────────────────
        const scaledPos = hitPosition.div(max(uniforms.ribbonBandScale, float(0.001)));
        const pAbs = abs(scaledPos).mul(float(1.25));
        const RT = float(0.065)
          .div(max(length(pAbs), float(0.0001)))
          .add(uniforms.time.mul(uniforms.ribbonRotationSpeed));

        // fcos1 port: anti-aliased cosine — fades high-frequency terms via fwidth
        const fcos = (arg) => {
          const w = fwidth(arg);
          return cos(arg).mul(smoothstep(float(Math.PI * 2), float(0), w));
        };

        const TWO_PI_C = float(Math.PI * 2);
        const ribbonCol = vec3(0.3, 0.4, 0.5).toVar('ribbonCol');
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(1.0 )).add(vec3(0.0, 0.8, 1.1))).mul(float(0.12)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(3.1 )).add(vec3(0.3, 0.4, 0.1))).mul(float(0.11)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(5.1 )).add(vec3(0.1, 0.7, 1.1))).mul(float(0.10)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(17.1)).add(vec3(0.2, 0.6, 0.7))).mul(float(0.10)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(31.1)).add(vec3(0.1, 0.6, 0.7))).mul(float(0.10)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(65.1)).add(vec3(0.0, 0.5, 0.8))).mul(float(0.10)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(115.1)).add(vec3(0.1, 0.4, 0.7))).mul(float(0.10)));
        ribbonCol.addAssign(fcos(TWO_PI_C.mul(RT).mul(float(265.1)).add(vec3(1.1, 1.4, 2.7))).mul(float(0.10)));
        ribbonCol.assign(clamp(ribbonCol, float(0), float(1)));

        // ── shading ───────────────────────────────────────────────────────────
        // Tilt the shading normal radially outward from the disk centre.
        // diskDir is the unit in-plane direction (x,z) of the hit point.
        // The fake normal is normalize( (diskDir.x*1.2, diskDir.z*1.2, 1) ),
        // matching the GLSL fix: normalize(normnew + vec3(pos.x, pos.z, 0)*1.2).
        const diskDirX = hitPosition.x.div(max(hitRadius, float(0.001)));
        const diskDirZ = hitPosition.z.div(max(hitRadius, float(0.001)));
        const shadNorm = normalize(vec3(
          diskDirX.mul(float(1.2)),
          diskDirZ.mul(float(1.2)),
          float(1)
        ));

        // l_dir after both rotations in the GLSL (rotz(0.5) then rotz(-π/2)):
        // normalize(0,1,0)*rotz(0.5) → (-sin0.5, cos0.5, 0)
        // then *rotz(-π/2)           → (cos0.5,  sin0.5, 0) ≈ (0.878, 0.479, 0)
        const lDir = vec3(float(0.878), float(0.479), float(0.0));

        const shadDot  = dot(shadNorm, lDir);
        const difVal   = clamp(shadDot, float(0), float(1));
        const ambVal   = clamp(float(0.5).add(float(0.5).mul(shadDot)), float(0), float(1));
        const shad     = vec3(0.32, 0.43, 0.54).mul(ambVal)
                           .add(vec3(1.0, 0.9, 0.7).mul(difVal));
        const tcr      = vec3(1.0, 0.21, 0.11);            // unlit red tint
        const unlitMask = clamp(
          float(1).sub(ambVal.add(difVal)), float(0), float(1)
        );

        // First squaring pass: tcol = clamp(ribbonCol*ribbonCol*2, 0, 1)
        const tcol = clamp(ribbonCol.mul(ribbonCol).mul(float(2)), float(0), float(1));
        const ta   = clamp(length(tcol), float(0), float(1));   // perceived brightness

        // Apply lighting: lit (shad) + unlit (red tcr)
        const litPart   = tcol.mul(shad).mul(float(1.4));
        const unlitPart = tcr.mul(tcol).mul(float(3.0)).mul(unlitMask);

        // Second squaring pass: clamp(2*combined*combined, 0, 1)
        const combined        = litPart.add(unlitPart);
        const finalRibbonCol  = clamp(combined.mul(combined).mul(float(2)), float(0), float(1));

        // ── edge fades ────────────────────────────────────────────────────────
        const ribbonOuterFade = smoothstep(float(1.0), float(0.8), normalizedRadius);
        const ribbonInnerFade = smoothstep(float(0.0), float(0.08), normalizedRadius);
        const diskDensity = ribbonInnerFade.mul(ribbonOuterFade);

        outColor.assign(finalRibbonCol.mul(uniforms.diskBrightness).mul(float(2.2)).mul(diskDensity));
        outOpacity.assign(clamp(
          ta.mul(diskDensity).mul(uniforms.diskBrightness).mul(float(0.95)),
          float(0), float(1)
        ));
      }).Else(() => {
        If(uniforms.diskVariant.greaterThan(float(1.5)), () => {
          // ── CHROMATIC RINGS VARIANT ──────────────────────────────────────────
          // Based on diskTexture from legacyDiskShaderExample.glsl.
          // Animated sinusoidal spiral rings with a time-cycling HSL color palette.

          // Map normalizedRadius to original D space [0.153, 0.968]
          const Dorig = normalizedRadius.mul(float(0.815)).add(float(0.153));

          // Inner edge ramp: rises steeply from 0 at inner edge
          const Fraw = clamp(
            Dorig.sub(float(0.153)).mul(float(30.0)),
            float(0),
            float(1)
          );
          const F = Fraw.mul(Fraw);

          // Outer fade (original: D = 1-D; D *= min(1, 10*D); D0 = D; D = pow(D, 1.5))
          const Dinv = float(1.0).sub(Dorig);
          const D0 = Dinv.mul(clamp(Dinv.mul(float(10.0)), float(0), float(1)));
          const D = pow(D0, float(1.5));

          // Three-harmonic spiral ring pattern (from original sinPatterns)
          const sinPat = sin(
            D.mul(float(-80.0).mul(uniforms.chromaticRingFreq))
              .add(
                uniforms.time.mul(float(5.0).mul(uniforms.chromaticAnimSpeed))
              )
              .add(hitAngle.mul(float(-1.0)))
          )
            .add(
              sin(
                D.mul(float(-152.0).mul(uniforms.chromaticRingFreq))
                  .add(
                    uniforms.time.mul(
                      float(3.0).mul(uniforms.chromaticAnimSpeed)
                    )
                  )
                  .add(hitAngle.mul(float(-1.0)))
              ).mul(float(0.3))
            )
            .add(
              sin(
                D.mul(float(-134.0).mul(uniforms.chromaticRingFreq))
                  .add(
                    uniforms.time.mul(
                      float(10.0).mul(uniforms.chromaticAnimSpeed)
                    )
                  )
                  .add(hitAngle.mul(float(-1.0)))
              ).mul(float(0.2))
            );

          // Cycling HSL-style color: hue shifts with time + radial position
          const TWO_THIRDS_PI = float((Math.PI * 2) / 3);
          const colorShift = uniforms.time
            .negate()
            .mul(uniforms.chromaticColorSpeed)
            .add(float(3.0))
            .add(D0.mul(float(4.0)));
          const chromaticCol = vec3(
            sin(colorShift).add(float(1.0)).mul(float(0.5)),
            sin(colorShift.add(TWO_THIRDS_PI)).add(float(1.0)).mul(float(0.5)),
            sin(colorShift.add(TWO_THIRDS_PI.mul(float(2.0))))
              .add(float(1.0))
              .mul(float(0.5))
          );
          // Lighten toward white, then gamma-encode for perceptual evenness
          const chromaticLightened = mix(
            chromaticCol,
            vec3(1, 1, 1),
            uniforms.chromaticSaturation
          );
          const chromaticGamma = pow(chromaticLightened, vec3(2.2));

          const pattern = abs(sinPat).mul(float(0.5)).add(float(0.5));
          const chromaticIntensity = F.mul(D)
            .mul(pattern)
            .mul(float(8.0))
            .mul(uniforms.diskBrightness);

          outColor.assign(chromaticGamma.mul(chromaticIntensity));
          outOpacity.assign(clamp(chromaticIntensity, float(0), float(1)));
        }).Else(() => {
          If(uniforms.diskVariant.greaterThan(float(0.5)), () => {
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
            const innerFade = smoothstep(
              float(0),
              float(0.07),
              normalizedRadius
            );
            const outerFade = smoothstep(
              float(1),
              float(0.55),
              normalizedRadius
            );
            const diskMask = innerFade.mul(outerFade);

            // Blend filaments with a base floor so disk has persistent presence
            const structuredDensity = mix(filaments, float(1), float(0.2)).mul(
              diskMask
            );

            // ISCO emission ring: intense narrow gaussian at the innermost stable orbit
            const iscoNorm = normalizedRadius.div(float(0.1));
            const iscoRing = exp(iscoNorm.negate().mul(iscoNorm)).mul(
              float(5.0)
            );
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
        }); // close chromatic Else
      }); // close ribbon Else

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
    // ACES for all variants except texture (diskVariant=0 uses gamma to match original look)
    const finalColor = mix(
      gammaResult,
      acesResult,
      clamp(uniforms.diskVariant, float(0), float(1))
    );

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
