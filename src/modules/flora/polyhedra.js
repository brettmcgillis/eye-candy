const PHI = (1 + Math.sqrt(5)) / 2;

function cyclic(a, b, c) {
  return [
    [a, b, c],
    [b, c, a],
    [c, a, b],
  ];
}

function signed(pattern) {
  const points = [];

  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sy) => {
      [-1, 1].forEach((sz) => {
        points.push([pattern[0] * sx, pattern[1] * sy, pattern[2] * sz]);
      });
    });
  });

  return points;
}

function spread(pattern) {
  return cyclic(...pattern).flatMap((axis) =>
    signed(axis).map((point) => point)
  );
}

function unique(points) {
  return points.filter(
    (p, i) =>
      points.findIndex(
        (q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6
      ) === i
  );
}

function normalizeShape(points) {
  const scale = Math.max(...points.map((p) => Math.hypot(...p)));

  return points.map((p) => p.map((v) => v / scale));
}

function shortestEdges(vertices) {
  let shortest = Infinity;

  vertices.forEach((a, i) =>
    vertices.slice(i + 1).forEach((b) => {
      shortest = Math.min(
        shortest,
        Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
      );
    })
  );

  const edges = [];

  vertices.forEach((a, i) =>
    vertices.forEach((b, j) => {
      if (j > i) {
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

        if (d < shortest * 1.02) {
          edges.push([i, j]);
        }
      }
    })
  );

  return edges;
}

function trapezohedron() {
  const ringY = 0.32;
  const apexY = 1.18;
  const vertices = [
    [0, apexY, 0],
    [0, -apexY, 0],
  ];

  for (let i = 0; i < 5; i += 1) {
    const upper = (i * 2 * Math.PI) / 5;
    const lower = upper + Math.PI / 5;

    vertices.push([Math.cos(upper), ringY, Math.sin(upper)]);
    vertices.push([Math.cos(lower), -ringY, Math.sin(lower)]);
  }

  const edges = [];

  for (let i = 0; i < 5; i += 1) {
    const upper = 2 + i * 2;
    const lower = 3 + i * 2;
    const nextUpper = 2 + ((i + 1) % 5) * 2;
    const nextLower = 3 + ((i + 1) % 5) * 2;

    edges.push(
      [0, upper],
      [1, lower],
      [upper, lower],
      [lower, nextUpper],
      [nextLower, nextUpper]
    );
  }

  return {
    edges: edges.filter(
      ([a, b], i) =>
        edges.findIndex(
          ([c, d]) => (c === a && d === b) || (c === b && d === a)
        ) === i
    ),
    vertices: normalizeShape(vertices),
  };
}

function shapeFrom(points) {
  const vertices = normalizeShape(unique(points));

  return { edges: shortestEdges(vertices), vertices };
}

const DICE = {
  d4: shapeFrom([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  d6: shapeFrom(signed([1, 1, 1])),
  d8: shapeFrom(spread([1, 0, 0])),
  d10: trapezohedron(),
  d12: shapeFrom([...signed([1, 1, 1]), ...spread([0, 1 / PHI, PHI])]),
  d20: shapeFrom(spread([0, 1, PHI])),
};

function ringsWire(segments = 12) {
  const vertices = [];
  const edges = [];

  [0, 1, 2].forEach((plane) => {
    const base = vertices.length;

    for (let i = 0; i < segments; i += 1) {
      const a = (i / segments) * Math.PI * 2;
      const point = [0, 0, 0];

      point[plane] = Math.cos(a);
      point[(plane + 1) % 3] = Math.sin(a);
      vertices.push(point);
      edges.push([base + i, base + ((i + 1) % segments)]);
    }
  });

  return { edges, vertices };
}

function loopWire(points) {
  return {
    edges: points.map((_, i) => [i, (i + 1) % points.length]),
    planar: true,
    vertices: points.map(([x, y]) => [x, y, 0]),
  };
}

function heartOutline(steps = 28) {
  const points = Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;

    return [
      16 * Math.sin(t) ** 3,
      13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t),
    ];
  });
  const scale = Math.max(
    ...points.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)])
  );

  return loopWire(points.map(([x, y]) => [x / scale, y / scale]));
}

function petalOutline(steps = 13) {
  const side = (sign) =>
    Array.from({ length: steps }, (_, i) => {
      const along = i / (steps - 1);
      const half = Math.sin(along ** 0.7 * Math.PI) * 0.55;

      return [sign * half, along * 2 - 1];
    });

  return loopWire([...side(1), ...side(-1).reverse()]);
}

const WIRE_MODELS = {
  ...DICE,
  heart: heartOutline(),
  petal: petalOutline(),
  sphere: ringsWire(),
};

export default DICE;

export { WIRE_MODELS };

export const DICE_SHAPES = Object.keys(DICE);

export const SOLID_SHAPES = ['sphere', ...DICE_SHAPES];
