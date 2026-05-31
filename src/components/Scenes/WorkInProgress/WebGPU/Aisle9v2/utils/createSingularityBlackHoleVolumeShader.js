import {
  Break,
  Fn,
  If,
  Loop,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
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
  createNebulaField,
  createStarField,
  fbm,
} from './blackHoleShaderHelpers';

const MAX_SINGULARITY_STEPS = 256;

const SingularityBlackHoleResult = struct(
  { color: 'vec4', depth: 'float' },
  'Aisle9v2SingularityBlackHoleResult'
);

function createRampColor(uniforms) {
  return Fn(([rampValue]) => {
    const firstBlend = smoothstep(
      uniforms.rampPos1,
      uniforms.rampPos2,
      rampValue
    );
    const secondBlend = smoothstep(
      uniforms.rampPos2,
      uniforms.rampPos3,
      rampValue
    );
    const firstColor = mix(
      uniforms.rampColor1,
      uniforms.rampColor2,
      firstBlend
    );
    return mix(firstColor, uniforms.rampColor3, secondBlend);
  });
}

export default function createSingularityBlackHoleVolumeShader(uniforms) {
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const rampColor = createRampColor(uniforms);

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
    const color = vec3(0, 0, 0).toVar('color');
    const alpha = float(0).toVar('alpha');
    const escaped = float(0).toVar('escaped');
    const hitRecorded = float(0).toVar('hitRecorded');
    const hitLocal = vec3(0, 0, 0).toVar('hitLocal');

    Loop(
      {
        start: int(0),
        end: int(MAX_SINGULARITY_STEPS),
        type: 'int',
        condition: '<',
      },
      ({ i }) => {
        If(i.greaterThanEqual(uniforms.iterations), () => {
          Break();
        });

        If(escaped.greaterThan(0.5).or(alpha.greaterThan(0.995)), () => {
          Break();
        });

        const radius = length(rayPosition);
        If(radius.greaterThan(1.02), () => {
          escaped.assign(1);
          Break();
        });

        const flatRadius = sqrt(
          rayPosition.x.mul(rayPosition.x).add(rayPosition.z.mul(rayPosition.z))
        );
        const rangeFade = smoothstep(float(1), uniforms.originRadius, radius);
        const steering = normalize(rayPosition)
          .mul(uniforms.stepSize)
          .mul(uniforms.power)
          .div(max(radius.mul(radius), float(0.0001)))
          .mul(rangeFade);
        rayDirection.assign(normalize(rayDirection.sub(steering)));
        rayPosition.addAssign(rayDirection.mul(uniforms.stepSize));

        const rotPhase = flatRadius.mul(4.27).sub(uniforms.time.mul(0.1));
        const rotatedX = rayPosition.x
          .mul(rotPhase.cos())
          .sub(rayPosition.z.mul(rotPhase.sin()));
        const rotatedZ = rayPosition.x
          .mul(rotPhase.sin())
          .add(rayPosition.z.mul(rotPhase.cos()));
        const noisePoint = vec3(
          rotatedX.mul(uniforms.fieldScale),
          rayPosition.y.mul(uniforms.fieldScale).add(uniforms.time.mul(0.05)),
          rotatedZ.mul(uniforms.fieldScale)
        );
        const noiseValue = fbm(noisePoint, float(2), float(0.55));
        const bandDistance = rayPosition.y
          .abs()
          .div(max(uniforms.bandWidth, float(0.0001)));
        const bandMask = clamp(
          float(1).sub(bandDistance.mul(bandDistance)),
          float(0),
          float(1)
        );
        const radialMask = smoothstep(
          uniforms.originRadius,
          uniforms.fieldRadius,
          flatRadius
        );
        const outerFade = smoothstep(
          uniforms.fieldRadius.mul(1.1),
          uniforms.fieldRadius.mul(0.6),
          flatRadius
        );
        const insideCore = radius.lessThan(uniforms.originRadius);

        const rampValue = clamp(
          flatRadius
            .div(max(uniforms.fieldRadius, float(0.001)))
            .add(noiseValue.sub(0.5).mul(0.85)),
          float(0),
          float(1)
        );
        const baseColor = rampColor(rampValue).mul(uniforms.emissionStrength);
        const shadedColor = mix(baseColor, vec3(0), insideCore);
        const alphaNoise = noiseValue.sub(0.45).mul(1.2);
        const bandAlpha = clamp(bandMask.add(alphaNoise), float(0), float(1));
        const alphaLocal = mix(
          bandAlpha.mul(radialMask).mul(outerFade),
          float(1),
          insideCore
        );
        const remainingAlpha = float(1).sub(alpha);
        color.addAssign(shadedColor.mul(alphaLocal).mul(remainingAlpha));
        alpha.addAssign(alphaLocal.mul(remainingAlpha));

        If(hitRecorded.lessThan(0.5).and(alphaLocal.greaterThan(0.04)), () => {
          hitLocal.assign(rayPosition);
          hitRecorded.assign(1);
        });
      }
    );

    If(
      uniforms.useBackground.greaterThan(0.5).and(alpha.lessThan(0.99)),
      () => {
        const backgroundColor =
          uniforms.starBackgroundColor.toVar('backgroundColor');
        backgroundColor.addAssign(starField(rayDirection));
        backgroundColor.addAssign(nebulaField(rayDirection));
        color.addAssign(backgroundColor.mul(float(1).sub(alpha)));
      }
    );

    const finalAlpha = mix(alpha, float(1), uniforms.useBackground);
    const straightColor = color.div(max(finalAlpha, float(0.0001)));
    const finalColor = pow(straightColor, vec3(1 / 2.2));
    const depthValue = float(1).toVar('depthValue');

    If(hitRecorded.greaterThan(0.5), () => {
      const clipPosition = cameraProjectionMatrix.mul(
        modelViewMatrix.mul(vec4(hitLocal, 1))
      );
      depthValue.assign(clipPosition.z.div(clipPosition.w));
    });

    return SingularityBlackHoleResult(vec4(finalColor, finalAlpha), depthValue);
  })();
}
