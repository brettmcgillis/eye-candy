export function getRandomHexColor(time) {
  const hexColor = Math.floor(time).toString(16);
  const paddedHexColor = hexColor.padStart(6, '0');
  return `#${paddedHexColor}`;
}

export function getInverseHexColorFromTimeElapsed(time) {
  const hexColor = (16777215 - Math.floor(time)).toString(16);
  const paddedHexColor = hexColor.padStart(6, '0');
  return `#${paddedHexColor}`;
}
