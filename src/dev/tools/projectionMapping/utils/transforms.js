function centerOf(corners) {
  return corners.reduce(
    (center, corner) => ({
      x: center.x + corner.x / corners.length,
      y: center.y + corner.y / corners.length,
    }),
    { x: 0, y: 0 }
  );
}

export function fitCorners(output, inset = 0) {
  return [
    { x: inset, y: inset },
    { x: output.width - inset, y: inset },
    { x: output.width - inset, y: output.height - inset },
    { x: inset, y: output.height - inset },
  ];
}

export function resetCorners(output) {
  return fitCorners(output, Math.min(output.width, output.height) * 0.125);
}

export function scaleCorners(corners, factor) {
  const center = centerOf(corners);
  return corners.map((corner) => ({
    x: center.x + (corner.x - center.x) * factor,
    y: center.y + (corner.y - center.y) * factor,
  }));
}

export function rotateCorners(corners, degrees) {
  const center = centerOf(corners);
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return corners.map((corner) => {
    const x = corner.x - center.x;
    const y = corner.y - center.y;
    return {
      x: center.x + x * cosine - y * sine,
      y: center.y + x * sine + y * cosine,
    };
  });
}

export function translateCorners(corners, x, y) {
  return corners.map((corner) => ({
    x: corner.x + x,
    y: corner.y + y,
  }));
}
