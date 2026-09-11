const EPSILON = 0.000001;

function solveLinearSystem(matrix, values) {
  const size = values.length;
  const rows = matrix.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(rows[pivot][column]) < EPSILON) return null;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];

    const divisor = rows[column][column];
    for (let entry = column; entry <= size; entry += 1) {
      rows[column][entry] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row !== column) {
        const factor = rows[row][column];
        for (let entry = column; entry <= size; entry += 1) {
          rows[row][entry] -= factor * rows[column][entry];
        }
      }
    }
  }

  return rows.map((row) => row[size]);
}

function cross(first, second, third) {
  return (
    (second.x - first.x) * (third.y - second.y) -
    (second.y - first.y) * (third.x - second.x)
  );
}

export function isValidQuad(corners) {
  if (
    !Array.isArray(corners) ||
    corners.length !== 4 ||
    corners.some((corner) => !Number.isFinite(corner.x + corner.y))
  ) {
    return false;
  }

  const signs = corners.map((corner, index) =>
    cross(corner, corners[(index + 1) % 4], corners[(index + 2) % 4])
  );
  return (
    signs.every((value) => value > EPSILON) ||
    signs.every((value) => value < -EPSILON)
  );
}

export function getProjectiveTransform(width, height, corners) {
  if (width <= 0 || height <= 0 || !isValidQuad(corners)) return null;

  const source = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const matrix = [];
  const values = [];

  source.forEach(([x, y], index) => {
    const destination = corners[index];
    matrix.push([x, y, 1, 0, 0, 0, -destination.x * x, -destination.x * y]);
    values.push(destination.x);
    matrix.push([0, 0, 0, x, y, 1, -destination.y * x, -destination.y * y]);
    values.push(destination.y);
  });

  const solution = solveLinearSystem(matrix, values);
  if (!solution?.every(Number.isFinite)) return null;

  const [a, b, c, d, e, f, g, h] = solution;
  return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(
    ','
  )})`;
}
