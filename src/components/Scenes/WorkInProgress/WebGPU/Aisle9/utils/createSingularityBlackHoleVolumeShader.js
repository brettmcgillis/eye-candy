import {
  Break,
  Fn,
  If,
  Loop,
  abs,
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
  texture as textureSample,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { createNebulaField, createStarField } from './blackHoleShaderHelpers';

const MAX_SINGULARITY_STEPS = 256;

const SingularityBlackHoleResult = struct(
  { color: 'vec4', depth: 'float' },
  'Aisle9SingularityBlackHoleResult'
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

export default function createSingularityBlackHoleVolumeShader(
  uniforms,
  { noiseTextureNode }
) {
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

        // Rotate around Y axis (disk lies in XZ plane, Y is perpendicular)
        const rotPhase = flatRadius.mul(4.27).sub(uniforms.time.mul(0.1));
        const rotatedX = rayPosition.x
          .mul(rotPhase.cos())
          .sub(rayPosition.z.mul(rotPhase.sin()));
        const rotatedZ = rayPosition.x
          .mul(rotPhase.sin())
          .add(rayPosition.z.mul(rotPhase.cos()));

        // UV scale controlled by fieldScale (default 3.8 → scale 2.0, matching singularity)
        const noiseUV = vec2(rotatedX, rotatedZ).mul(
          uniforms.fieldScale.div(1.9)
        );

        // Sample deep noise texture (RGB channels for richer patterns)
        const noiseDeep = textureSample(noiseTextureNode, noiseUV).rgb;

        // Band shape in Y dimension — smooth quadratic falloff from disk plane
        const bandMin = uniforms.bandWidth.negate();
        const bandEnds = vec3(bandMin, float(0), uniforms.bandWidth);
        const dy = bandEnds.sub(vec3(rayPosition.y));
        const yQuad = dy.mul(dy).div(uniforms.bandWidth);
        const yBand = max(
          uniforms.bandWidth.sub(yQuad).div(uniforms.bandWidth),
          vec3(0, 0, 0)
        );

        // Noise gated by band (zero outside the disk)
        const noiseAmp = noiseDeep.mul(yBand);
        const noiseAmpLen = sqrt(
          noiseAmp.x
            .mul(noiseAmp.x)
            .add(noiseAmp.y.mul(noiseAmp.y))
            .add(noiseAmp.z.mul(noiseAmp.z))
        );

        // Pseudo-normal: offset sample × large multiplier = sharp ring filaments
        const noiseNormal = textureSample(
          noiseTextureNode,
          noiseUV.mul(1.002)
        ).rgb.mul(yBand);
        const noiseNormalLen = sqrt(
          noiseNormal.x
            .mul(noiseNormal.x)
            .add(noiseNormal.y.mul(noiseNormal.y))
            .add(noiseNormal.z.mul(noiseNormal.z))
        );

        const insideCore = radius.lessThan(uniforms.originRadius);

        // Ramp input: singularity formula — the ×19.75 term creates the sharp ring detail
        const rampValue = flatRadius
          .add(noiseAmpLen.sub(0.78).mul(1.5))
          .add(noiseAmpLen.sub(noiseNormalLen).mul(19.75));

        const baseColor = rampColor(rampValue).mul(uniforms.emissionStrength);
        const shadedColor = mix(baseColor, vec3(0), insideCore);

        // Alpha: noise modulates Y-threshold (singularity formula)
        const radialAlpha = smoothstep(
          uniforms.fieldRadius,
          float(0),
          flatRadius
        );
        const alphaPre = abs(rayPosition.y).add(
          noiseAmpLen.sub(0.75).mul(-0.6)
        );
        const tAlpha = clamp(
          uniforms.bandWidth
            .sub(alphaPre)
            .div(max(uniforms.bandWidth, float(0.0001))),
          float(0),
          float(1)
        );
        const smoothTAlpha = tAlpha
          .mul(tAlpha)
          .mul(float(3).sub(tAlpha.mul(2)));
        const bandAlpha = mix(float(0), radialAlpha, smoothTAlpha);

        const alphaLocal = mix(bandAlpha, float(1), insideCore);
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
