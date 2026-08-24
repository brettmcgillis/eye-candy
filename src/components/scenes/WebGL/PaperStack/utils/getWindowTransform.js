export default function getWindowTransform(baseOffset, layer, config) {
  const angle = config.patternRotation + layer.spiral;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const x = baseOffset[0] * cos - baseOffset[1] * sin;
  const y = baseOffset[0] * sin + baseOffset[1] * cos;

  return {
    x: config.windowXY.x + x * layer.scale,
    y: config.windowXY.y + y * layer.scale,
    zRotation: config.windowRotation + layer.spiral,
    size: config.safeWindowSize * layer.scale,
  };
}
