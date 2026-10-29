const CORNERS = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];
const SOLID_FACES = [
  [4, 5, 6, 7],
  [1, 0, 3, 2],
  [0, 4, 7, 3],
  [5, 1, 2, 6],
  [3, 7, 6, 2],
  [0, 1, 5, 4],
];

export function isHollow(config, layer) {
  return (layer ? config.upperStyle : config.lowerStyle) === 'hollow';
}
export default function tileMesh(hollow, width = 0.12) {
  const ring = hollow ? [1, 1 - width * 2] : [1];
  const vertices = [];
  [-0.5, 0.5].forEach((z) =>
    ring.forEach((scale) =>
      CORNERS.forEach(([x, y]) => vertices.push([x * scale, y * scale, z]))
    )
  );
  const faces = [];
  if (!hollow)
    SOLID_FACES.forEach((indices, i) => faces.push({ indices, top: i === 0 }));
  else {
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4;
      faces.push(
        {
          indices: [8 + i, 8 + j, 12 + j, 12 + i],
          top: true,
          edges: [true, false, true, false],
        },
        { indices: [i, 4 + i, 4 + j, j], edges: [false, true, false, true] },
        { indices: [i, j, 8 + j, 8 + i] },
        { indices: [4 + j, 4 + i, 12 + i, 12 + j] }
      );
    }
  }
  const indices = faces.flatMap((face) => {
    const [a, b, c, d] = face.indices;
    return [a, b, c, a, c, d];
  });
  return { vertices, faces, positions: vertices.flat(), indices };
}
