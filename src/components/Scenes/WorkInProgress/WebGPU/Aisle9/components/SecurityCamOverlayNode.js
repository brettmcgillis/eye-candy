import { mix, screenUV, step, texture, vec2, vec3, vec4 } from 'three/tsl';

const HUD_COLOR = vec3(0.95, 1.0, 0.97);

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
  const overlayMix = uniforms.surveillanceOverlayEnabled;
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
  const hudMask = buildFrameMask(frameUv);
  const hudColor = HUD_COLOR.mul(
    uniforms.surveillanceHudOpacity.mul(effectBoost).mul(overlayMix)
  );
  const withLines = sceneNode.rgb.add(hudColor.mul(hudMask).mul(frameMask));
  const textSample = texture(timestampTexture, frameUv);
  const textAlpha = textSample.a
    .mul(uniforms.surveillanceHudOpacity.mul(1.7).clamp(0.0, 1.0))
    .mul(effectBoost)
    .mul(overlayMix)
    .mul(frameMask)
    .clamp(0.0, 1.0);
  const outputColor = mix(withLines, textSample.rgb, textAlpha);

  return vec4(outputColor, sceneNode.a);
}
