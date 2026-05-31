import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  atan,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  cos,
  cross,
  dot,
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
  vec3,
  vec4,
} from 'three/tsl';

import {
  applyRadiusTint,
  blackbodyColor,
  createNebulaField,
  createStarField,
} from './blackHoleShaderHelpers';

const MAX_LEGACY_STEPS = 256;
const TWO_PI = Math.PI * 2;

const LegacyBlackHoleResult = struct(
  { color: 'vec4', depth: 'float' },
  'Aisle9v2LegacyBlackHoleResult'
);

function createLegacyDiskColor(uniforms) {
  return Fn(([hitPosition, hitRadius, hitAngle, rayDirection]) => {
    const normalizedRadius = clamp(
      hitRadius
        .sub(uniforms.innerRadius)
        .div(uniforms.outerRadius.sub(uniforms.innerRadius)),
      float(0),
      float(1)
    );
    const diskVelocity = vec3(hitPosition.z.negate(), float(0), hitPosition.x)
      .div(sqrt(max(hitRadius.sub(1), float(0.001))))
      .div(max(hitRadius.mul(hitRadius), float(0.001)));
    const gamma = float(1).div(
      sqrt(max(float(1).sub(dot(diskVelocity, diskVelocity)), float(0.001)))
    );
    const doppler = gamma.mul(
      float(1).add(dot(normalize(rayDirection), diskVelocity))
    );
    const temperature = float(uniforms.diskTemperature).div(
      max(float(0.2), doppler.pow(uniforms.dopplerStrength))
    );
    const baseColor = blackbodyColor(temperature).toVar('baseColor');
    const tintedColor = applyRadiusTint(
      baseColor,
      uniforms.innerColor,
      uniforms.outerColor,
      normalizedRadius,
      float(0.45)
    );

    const stripePattern = sin(hitAngle.mul(14).add(uniforms.time.mul(0.9)))
      .mul(0.5)
      .add(0.5);
    const stripeSharp = pow(stripePattern, float(0.55));
    const edgeFade = smoothstep(float(0), float(0.08), normalizedRadius).mul(
      smoothstep(float(1), float(0.72), normalizedRadius)
    );
    const opacity = clamp(
      stripeSharp.mul(edgeFade).mul(uniforms.diskBrightness),
      float(0),
      float(1)
    );

    return vec4(tintedColor.mul(uniforms.diskBrightness), opacity);
  });
}

export default function createLegacyBlackHoleVolumeShader(uniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const diskColor = createLegacyDiskColor(uniforms);

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
                lastDirection
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
        const backgroundColor =
          uniforms.starBackgroundColor.toVar('backgroundColor');
        backgroundColor.addAssign(starField(lastDirection));
        backgroundColor.addAssign(nebulaField(lastDirection));
        color.addAssign(backgroundColor.mul(float(1).sub(alpha)));
      }
    );

    const finalAlpha = mix(
      captured.max(alpha),
      float(1),
      uniforms.useBackground
    );
    const straightColor = color.div(max(finalAlpha, float(0.0001)));
    const finalColor = pow(straightColor, vec3(1 / 2.2));
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
