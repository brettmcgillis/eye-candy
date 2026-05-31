import {
  Fn,
  float,
  length,
  mix,
  screenUV,
  smoothstep,
  step,
  texture,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

const CCTV_TINT = vec3(0.88, 0.97, 0.91);
const HUD_COLOR = vec3(0.95, 1.0, 0.97);

const hash21 = Fn(([point]) =>
  point.dot(vec2(127.1, 311.7)).sin().mul(43758.5453123).fract()
).setLayout({
  name: 'hash21',
  type: 'float',
  inputs: [{ name: 'point', type: 'vec2' }],
});

function rectMask(uv, minX, minY, maxX, maxY) {
  return step(minX, uv.x)
    .mul(step(minY, uv.y))
    .mul(step(uv.x, maxX))
    .mul(step(uv.y, maxY));
}

function horizontalLine(uv, y, xMin, xMax, thickness) {
  const halfThickness = thickness * 0.5;

  return rectMask(uv, xMin, y - halfThickness, xMax, y + halfThickness);
}

function verticalLine(uv, x, yMin, yMax, thickness) {
  const halfThickness = thickness * 0.5;

  return rectMask(uv, x - halfThickness, yMin, x + halfThickness, yMax);
}

function buildFrameMask(uv) {
  const frameInset = 0.044;
  const cornerLength = 0.034;
  const cornerThickness = 0.0044;
  const frameThickness = 0.0026;
  const frameRight = 1 - frameInset;
  const frameBottom = 1 - frameInset;

  const topLeft = horizontalLine(
    uv,
    frameInset,
    frameInset,
    frameInset + cornerLength,
    cornerThickness
  ).add(
    verticalLine(
      uv,
      frameInset,
      frameInset,
      frameInset + cornerLength,
      cornerThickness
    )
  );
  const topRight = horizontalLine(
    uv,
    frameInset,
    frameRight - cornerLength,
    frameRight,
    cornerThickness
  ).add(
    verticalLine(
      uv,
      frameRight,
      frameInset,
      frameInset + cornerLength,
      cornerThickness
    )
  );
  const bottomLeft = horizontalLine(
    uv,
    frameBottom,
    frameInset,
    frameInset + cornerLength,
    cornerThickness
  ).add(
    verticalLine(
      uv,
      frameInset,
      frameBottom - cornerLength,
      frameBottom,
      cornerThickness
    )
  );
  const bottomRight = horizontalLine(
    uv,
    frameBottom,
    frameRight - cornerLength,
    frameRight,
    cornerThickness
  ).add(
    verticalLine(
      uv,
      frameRight,
      frameBottom - cornerLength,
      frameBottom,
      cornerThickness
    )
  );
  const sideGuides = verticalLine(
    uv,
    frameInset,
    0.28,
    0.72,
    frameThickness
  ).add(verticalLine(uv, frameRight, 0.28, 0.72, frameThickness));

  return topLeft.add(topRight).add(bottomLeft).add(bottomRight).add(sideGuides);
}

export default function applySecurityCamOverlay(
  sceneNode,
  uniforms,
  timestampTexture
) {
  const uv = screenUV;
  const fxMix = uniforms.surveillanceStoreEnabled.mul(
    uniforms.surveillanceFxEnabled
  );
  const overlayMix = uniforms.surveillanceStoreEnabled.mul(
    uniforms.surveillanceOverlayEnabled
  );
  const baseColor = sceneNode.rgb;
  const luminance = baseColor.dot(vec3(0.299, 0.587, 0.114));
  const grayscale = vec3(luminance, luminance, luminance);
  const desaturated = mix(
    baseColor,
    grayscale,
    uniforms.surveillanceDesaturation.mul(fxMix)
  );
  const tinted = mix(desaturated, desaturated.mul(CCTV_TINT), fxMix.mul(0.35));
  const frameMin = uniforms.surveillanceFrameMin;
  const frameMax = uniforms.surveillanceFrameMax;
  const frameSize = vec2(
    frameMax.x.sub(frameMin.x).max(0.0001),
    frameMax.y.sub(frameMin.y).max(0.0001)
  );
  const frameUv = vec2(
    uv.x.sub(frameMin.x).div(frameSize.x).clamp(0.0, 1.0),
    uv.y.sub(frameMin.y).div(frameSize.y).clamp(0.0, 1.0)
  );
  const frameMask = step(frameMin.x, uv.x)
    .mul(step(frameMin.y, uv.y))
    .mul(step(uv.x, frameMax.x))
    .mul(step(uv.y, frameMax.y));
  const effectBoost = uniforms.surveillanceEffectBoost;
  const scanline = uv.y
    .mul(uniforms.surveillanceScanlineDensity)
    .add(uniforms.surveillanceTime.mul(0.4))
    .sin()
    .abs();
  const scanlineShade = float(1.0).sub(
    scanline
      .mul(uniforms.surveillanceScanlineStrength)
      .mul(effectBoost)
      .mul(0.12)
      .mul(fxMix)
  );
  const noiseUv = uv
    .mul(vec2(1820.0, 1040.0))
    .add(
      vec2(
        uniforms.surveillanceTime.mul(23.71),
        uniforms.surveillanceTime.mul(17.13)
      )
    );
  const noise = hash21(noiseUv)
    .sub(0.5)
    .mul(uniforms.surveillanceNoiseAmount)
    .mul(effectBoost)
    .mul(fxMix);
  const centeredUv = vec2(uv.x.sub(0.5).mul(uniforms.aspect), uv.y.sub(0.5));
  const vignette = smoothstep(0.32, 0.94, length(centeredUv))
    .mul(uniforms.surveillanceVignette)
    .mul(effectBoost)
    .mul(fxMix);
  const rollingBandCenter = uniforms.surveillanceTime.mul(0.075).fract();
  const rollingBand = float(1.0)
    .sub(smoothstep(0.0, 0.18, uv.y.sub(rollingBandCenter).abs()))
    .mul(uniforms.surveillanceRollingBandStrength)
    .mul(effectBoost)
    .mul(fxMix);
  const flicker = uniforms.surveillanceTime.mul(8.0).sin().mul(0.01).mul(fxMix);
  const gradedColor = tinted
    .add(vec3(noise, noise, noise))
    .mul(scanlineShade)
    .mul(float(1.0).sub(vignette.mul(0.55)))
    .mul(float(1.0).add(rollingBand.mul(0.08)).add(flicker));
  const hudMask = buildFrameMask(frameUv);
  const hudColor = HUD_COLOR.mul(
    uniforms.surveillanceHudOpacity.mul(effectBoost).mul(overlayMix)
  );
  const withLines = gradedColor.add(hudColor.mul(hudMask).mul(frameMask));
  const textSample = texture(timestampTexture, frameUv);
  // Alpha-composite the labels OVER the scene instead of adding them, so they
  // stay legible (and the red stays saturated) on any background. Boost the
  // coverage so the HUD opacity control still tilts toward fully opaque text.
  const textAlpha = textSample.a
    .mul(uniforms.surveillanceHudOpacity.mul(1.7).clamp(0.0, 1.0))
    .mul(effectBoost)
    .mul(overlayMix)
    .mul(frameMask)
    .clamp(0.0, 1.0);
  const outputColor = mix(withLines, textSample.rgb, textAlpha);

  return vec4(outputColor, sceneNode.a);
}
