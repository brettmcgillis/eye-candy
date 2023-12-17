function getColorsInRange(startColor, endColor, count) {
  // Convert hex color strings to RGB arrays
  const startRGB = hexToRgb(startColor);
  const endRGB = hexToRgb(endColor);

  // Calculate the color step for each channel (R, G, B)
  const step = {
    r: (endRGB.r - startRGB.r) / (count - 1),
    g: (endRGB.g - startRGB.g) / (count - 1),
    b: (endRGB.b - startRGB.b) / (count - 1),
  };

  // Generate an array of colors
  const colors = Array.from({ length: count }, (_, index) => {
    const r = Math.round(startRGB.r + step.r * index);
    const g = Math.round(startRGB.g + step.g * index);
    const b = Math.round(startRGB.b + step.b * index);

    // Convert RGB to hex
    const hexColor = rgbToHex(r, g, b);

    return hexColor;
  });

  return colors;
}

// Helper functions to convert between hex and RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default getColorsInRange;
