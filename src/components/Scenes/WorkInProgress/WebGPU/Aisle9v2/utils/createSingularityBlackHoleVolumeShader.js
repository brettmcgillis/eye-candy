import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  cameraPosition,
  clamp,
  equirectUV,
  faceDirection,
  float,
  fract,
  int,
  mat3,
  max,
  mix,
  modelWorldMatrixInverse,
  normalize,
  positionGeometry,
  positionWorld,
  step,
  texture as textureSample,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

const whiteNoise2D = Fn(([coord]) => {
  return fract(coord.dot(vec2(12.9898, 78.233)).sin().mul(43758.5453));
});

const lengthSqrt = Fn(([value]) => {
  return value.x
    .mul(value.x)
    .add(value.y.mul(value.y))
    .add(value.z.mul(value.z))
    .sqrt();
});

const smoothRange = Fn(([value, inMin, inMax, outMin, outMax]) => {
  const t = clamp(
    value.sub(inMin).div(max(inMax.sub(inMin), float(0.0001))),
    float(0),
    float(1)
  );
  const smoothT = t.mul(t).mul(float(3).sub(t.mul(2)));
  return mix(outMin, outMax, smoothT);
});

const rotateAxis = Fn(([axisValue, angleValue]) => {
  const axis = vec3(axisValue).toVar();
  const angle = float(angleValue).toVar();
  const s = angle.sin().toVar();
  const c = angle.cos().toVar();
  const oc = float(1).sub(c).toVar();

  return mat3(
    oc.mul(axis.x).mul(axis.x).add(c),
    oc.mul(axis.x).mul(axis.y).sub(axis.z.mul(s)),
    oc.mul(axis.z).mul(axis.x).add(axis.y.mul(s)),
    oc.mul(axis.x).mul(axis.y).add(axis.z.mul(s)),
    oc.mul(axis.y).mul(axis.y).add(c),
    oc.mul(axis.y).mul(axis.z).sub(axis.x.mul(s)),
    oc.mul(axis.z).mul(axis.x).sub(axis.y.mul(s)),
    oc.mul(axis.y).mul(axis.z).add(axis.x.mul(s)),
    oc.mul(axis.z).mul(axis.z).add(c)
  );
});

const catmullRom = Fn(([tValue, dValue, cValue, bValue, aValue]) => {
  const t = float(tValue).toVar();
  const d = vec3(dValue).toVar();
  const c = vec3(cValue).toVar();
  const b = vec3(bValue).toVar();
  const a = vec3(aValue).toVar();

  return float(0.5).mul(
    b
      .mul(2)
      .add(a.negate().add(c).mul(t))
      .add(a.mul(2).sub(b.mul(5)).add(c.mul(4)).sub(d).mul(t).mul(t))
      .add(a.negate().add(b.mul(3)).sub(c.mul(3)).add(d).mul(t).mul(t).mul(t))
  );
});

const colorRamp3BSpline = Fn(([tValue, aValue, bValue, cValue]) => {
  const t = float(tValue).toVar();
  const a = vec4(aValue).toVar();
  const b = vec4(bValue).toVar();
  const c = vec4(cValue).toVar();
  const ab = b.w.sub(a.w);
  const bc = c.w.sub(b.w);
  const iab = clamp(t.sub(a.w).div(max(ab, float(0.0001))), float(0), float(1));
  const ibc = clamp(t.sub(b.w).div(max(bc, float(0.0001))), float(0), float(1));
  const weights = vec3(float(1).sub(iab), iab.sub(ibc), ibc);
  const cA = catmullRom(weights.x, a.xyz, a.xyz, b.xyz, c.xyz);
  const cB = catmullRom(weights.y, a.xyz, b.xyz, c.xyz, c.xyz);
  const result = c.xyz.toVar('result');

  If(t.lessThan(b.w), () => {
    result.assign(cA);
  });

  If(t.greaterThanEqual(b.w).and(t.lessThan(c.w)), () => {
    result.assign(cB);
  });

  return result;
});

const MAX_SINGULARITY_STEPS = 256;

function createRampColor(uniforms) {
  return Fn(([rampValue]) => {
    const rampA = vec4(uniforms.rampColor1, uniforms.rampPos1);
    const rampB = vec4(uniforms.rampColor2, uniforms.rampPos2);
    const rampC = vec4(uniforms.rampColor3, uniforms.rampPos3);

    return colorRamp3BSpline(rampValue, rampA, rampB, rampC);
  });
}

export default function createSingularityBlackHoleVolumeShader(
  uniforms,
  { environmentTextureNode, noiseTextureNode }
) {
  const rampColor = createRampColor(uniforms);

  return Fn(() => {
    const objectCoords = positionGeometry.mul(vec3(1, 1, -1)).xzy;
    const isBackface = step(float(0), faceDirection.negate());
    const cameraLocal = modelWorldMatrixInverse.mul(
      vec4(cameraPosition, 1)
    ).xyz;
    const cameraPointObject = cameraLocal.mul(vec3(1, 1, -1)).xzy;
    const rayStart = mix(objectCoords, cameraPointObject.xyz, isBackface);
    const viewDirectionWorld = normalize(
      cameraPosition.sub(positionWorld).mul(vec3(1, 1, -1))
    ).xzy;
    const rayDirection = viewDirectionWorld.negate().toVar('rayDirection');
    const noiseWhite = whiteNoise2D(objectCoords.xy).mul(uniforms.noiseFactor);
    const jitter = rayDirection.mul(noiseWhite);
    const rayPosition = rayStart.sub(jitter).toVar('rayPosition');
    const colorAcc = vec3(0, 0, 0).toVar('colorAcc');
    const alphaAcc = float(0).toVar('alphaAcc');

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

        const radius = lengthSqrt(rayPosition);
        const radiusSq = radius.mul(radius);
        const steeringRange = clamp(
          float(1).sub(radius).div(float(0.5)),
          float(0),
          float(1)
        );
        const steering = normalize(rayPosition)
          .mul(uniforms.stepSize)
          .mul(uniforms.power)
          .div(max(radiusSq, float(0.0001)))
          .mul(steeringRange);
        const steeredDir = rayDirection.sub(steering).normalize();
        const advance = rayDirection.mul(uniforms.stepSize);

        rayPosition.addAssign(advance);

        const flatRadius = lengthSqrt(rayPosition.mul(vec3(1, 1, 0)));
        const rotPhase = flatRadius.mul(4.27).sub(uniforms.time.mul(0.1));
        const rotated = rayPosition.mul(rotateAxis(vec3(0, 0, 1), rotPhase));
        const noiseUv = vec2(rotated.x, rotated.y).mul(2);
        const noiseDeep = textureSample(noiseTextureNode, noiseUv).rgb;
        const bandMin = uniforms.bandWidth.negate();
        const bandEnds = vec3(bandMin, 0, uniforms.bandWidth);
        const bandDelta = bandEnds.sub(vec3(rayPosition.z));
        const bandQuad = bandDelta.mul(bandDelta).div(uniforms.bandWidth);
        const bandShape = max(
          uniforms.bandWidth.sub(bandQuad).div(uniforms.bandWidth),
          vec3(0, 0, 0)
        );
        const noiseAmp = noiseDeep.mul(bandShape);
        const noiseAmpLen = lengthSqrt(noiseAmp);
        const noiseNormal = textureSample(
          noiseTextureNode,
          noiseUv.mul(1.002)
        ).rgb.mul(bandShape);
        const noiseNormalLen = lengthSqrt(noiseNormal);
        const insideCore = lengthSqrt(rayPosition).lessThan(
          uniforms.originRadius
        );

        const rampValue = flatRadius
          .add(noiseAmpLen.sub(0.78).mul(1.5))
          .add(noiseAmpLen.sub(noiseNormalLen).mul(19.75));
        const baseColor = rampColor(rampValue)
          .mul(uniforms.emissionStrength)
          .add(uniforms.emissionColor);
        const shadedColor = mix(baseColor, vec3(0), insideCore);
        const alphaPre = abs(rayPosition.z).add(
          noiseAmpLen.sub(0.75).mul(-0.6)
        );
        const radialAlpha = smoothRange(
          flatRadius,
          float(1),
          float(0),
          float(0),
          float(1)
        );
        const bandAlpha = smoothRange(
          alphaPre,
          uniforms.bandWidth,
          float(0),
          float(0),
          radialAlpha
        );
        const alphaLocal = mix(bandAlpha, float(1), insideCore);
        const remainingAlpha = float(1).sub(alphaAcc);
        const weight = remainingAlpha.mul(alphaLocal);
        colorAcc.assign(mix(colorAcc, shadedColor, weight));
        alphaAcc.assign(mix(alphaAcc, float(1), alphaLocal));

        rayPosition.addAssign(advance);
        rayDirection.assign(steeredDir);
      }
    );

    const envDirection = rayDirection.mul(vec3(1, -1, 1)).xzy;
    const backgroundColor = textureSample(
      environmentTextureNode,
      equirectUV(envDirection)
    ).rgb.mul(uniforms.backgroundIntensity);

    return mix(
      colorAcc,
      backgroundColor,
      float(1).sub(alphaAcc).mul(uniforms.useBackground)
    );
  })();
}
