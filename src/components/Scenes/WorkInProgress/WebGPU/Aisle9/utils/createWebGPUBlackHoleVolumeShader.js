import {
  Break,
  Fn,
  If,
  Loop,
  atan,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
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
  smoothstep,
  sqrt,
  struct,
  vec3,
  vec4,
} from 'three/tsl';

import {
  blackbodyColor,
  createNebulaField,
  createStarField,
  fbm,
  keplerianVelocity,
} from './blackHoleShaderHelpers';

const MAX_WEBGPU_STEPS = 192;

const WebGPUBlackHoleResult = struct(
  { color: 'vec4', depth: 'float' },
  'Aisle9WebGPUBlackHoleResult'
);

function createDiskColor(uniforms) {
  return Fn(([hitRadius, hitAngle, timeValue, rayDir]) => {
    const normRadius = clamp(
      hitRadius
        .sub(uniforms.innerRadius)
        .div(uniforms.outerRadius.sub(uniforms.innerRadius)),
      float(0),
      float(1)
    );
    const peakTemperature = uniforms.diskTemperature.mul(1000);
    const temperature = peakTemperature.mul(
      pow(
        uniforms.innerRadius.div(
          max(hitRadius, uniforms.innerRadius.add(0.0001))
        ),
        uniforms.temperatureFalloff
      )
    );
    const diskColor = blackbodyColor(temperature).toVar('diskColor');
    const velocity = keplerianVelocity(
      hitRadius,
      uniforms.innerRadius,
      hitAngle,
      uniforms.rotationDirection
    );
    const beta = velocity.length().mul(0.24);
    const cosTheta = dot(velocity.normalize(), rayDir);
    const dopplerFactor = float(1).div(float(1).sub(beta.mul(cosTheta)));
    const dopplerBoost = pow(dopplerFactor, uniforms.dopplerStrength.mul(3));
    diskColor.mulAssign(clamp(dopplerBoost, float(0.2), float(5)));

    const edgeFalloff = smoothstep(
      float(0),
      uniforms.diskEdgeSoftnessInner,
      normRadius
    ).mul(
      smoothstep(
        float(1),
        float(1).sub(uniforms.diskEdgeSoftnessOuter),
        normRadius
      )
    );

    const cycleLength = max(uniforms.turbulenceCycleTime, float(0.001));
    const cycleTime = timeValue.mod(cycleLength);
    const blendFactor = cycleTime.div(cycleLength);
    const phase1 = cycleTime
      .mul(uniforms.rotationSpeed)
      .div(pow(max(hitRadius, float(0.001)), float(1.5)));
    const phase2 = cycleTime
      .add(cycleLength)
      .mul(uniforms.rotationSpeed)
      .div(pow(max(hitRadius, float(0.001)), float(1.5)));
    const stretched1 = vec3(
      hitRadius.mul(uniforms.turbulenceScale),
      hitAngle
        .add(phase1)
        .cos()
        .div(max(uniforms.turbulenceStretch, float(0.1))),
      hitAngle
        .add(phase1)
        .sin()
        .div(max(uniforms.turbulenceStretch, float(0.1)))
    );
    const stretched2 = vec3(
      hitRadius.mul(uniforms.turbulenceScale),
      hitAngle
        .add(phase2)
        .cos()
        .div(max(uniforms.turbulenceStretch, float(0.1))),
      hitAngle
        .add(phase2)
        .sin()
        .div(max(uniforms.turbulenceStretch, float(0.1)))
    );
    const turbulence1 = fbm(
      stretched1,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence
    );
    const turbulence2 = fbm(
      stretched2,
      uniforms.turbulenceLacunarity,
      uniforms.turbulencePersistence
    );
    const turbulence = mix(turbulence2, turbulence1, blendFactor);
    const ringOpacity = pow(
      clamp(turbulence, float(0), float(1)),
      uniforms.turbulenceSharpness
    );
    const finalOpacity = ringOpacity.mul(edgeFalloff);

    return vec4(diskColor.mul(uniforms.diskBrightness), finalOpacity);
  });
}

export default function createWebGPUBlackHoleVolumeShader(uniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const diskColor = createDiskColor(uniforms);

  return Fn(() => {
    const cameraLocal = modelWorldMatrixInverse.mul(
      vec4(cameraPosition, 1)
    ).xyz;
    const fragmentLocal = positionGeometry;
    const rayStart = mix(fragmentLocal, cameraLocal, uniforms.cameraInside);
    const rayDirection = normalize(fragmentLocal.sub(cameraLocal)).toVar(
      'rayDirection'
    );
    const rayPosition = rayStart.toVar('rayPosition');
    const previousPosition = rayStart.toVar('previousPosition');
    const color = vec3(0, 0, 0).toVar('color');
    const alpha = float(0).toVar('alpha');
    const escaped = float(0).toVar('escaped');
    const captured = float(0).toVar('captured');
    const hitRecorded = float(0).toVar('hitRecorded');
    const hitLocal = vec3(0, 0, 0).toVar('hitLocal');

    Loop(
      {
        start: int(0),
        end: int(MAX_WEBGPU_STEPS),
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

        const radius = length(rayPosition);

        If(radius.lessThan(uniforms.coreRadius.mul(1.02)), () => {
          If(hitRecorded.lessThan(0.5), () => {
            hitLocal.assign(rayPosition);
            hitRecorded.assign(1);
          });
          captured.assign(1);
          Break();
        });

        If(radius.greaterThan(1.02), () => {
          escaped.assign(1);
          Break();
        });

        const toCenter = rayPosition.negate().div(max(radius, float(0.0001)));
        const bendStrength = uniforms.mass
          .div(max(radius.mul(radius), float(0.0001)))
          .mul(uniforms.stepSize)
          .mul(uniforms.lensingStrength);
        rayDirection.addAssign(toCenter.mul(bendStrength));
        rayDirection.assign(normalize(rayDirection));

        previousPosition.assign(rayPosition);
        rayPosition.addAssign(rayDirection.mul(uniforms.stepSize));

        const crossedPlane = previousPosition.y.mul(rayPosition.y).lessThan(0);

        If(
          crossedPlane.and(alpha.lessThan(0.99)).and(captured.lessThan(0.5)),
          () => {
            const t = previousPosition.y
              .negate()
              .div(rayPosition.y.sub(previousPosition.y));
            const hitPosition = mix(previousPosition, rayPosition, t);
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
                hitRadius,
                hitAngle,
                uniforms.time,
                rayDirection
              );
              const remainingAlpha = float(1).sub(alpha);
              color.addAssign(
                diskResult.xyz.mul(diskResult.w).mul(remainingAlpha)
              );
              alpha.addAssign(remainingAlpha.mul(diskResult.w));

              If(
                hitRecorded.lessThan(0.5).and(diskResult.w.greaterThan(0.05)),
                () => {
                  hitLocal.assign(hitPosition);
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
      uniforms.useBackground
        .greaterThan(0.5)
        .and(escaped.greaterThan(0.5))
        .and(alpha.lessThan(0.99)),
      () => {
        const backgroundColor =
          uniforms.starBackgroundColor.toVar('backgroundColor');

        If(uniforms.starsEnabled.greaterThan(0.5), () => {
          backgroundColor.addAssign(starField(rayDirection));
        });

        If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
          backgroundColor.addAssign(nebulaField(rayDirection));
        });

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

    return WebGPUBlackHoleResult(vec4(finalColor, finalAlpha), depthValue);
  })();
}
