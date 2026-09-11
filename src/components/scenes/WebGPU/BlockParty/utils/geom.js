export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(t, a, b) {
  return a * (1 - t) + b * t;
}

function lineIntersectLine(a, b, e, f) {
  const a1 = b.y - a.y;
  const b1 = a.x - b.x;
  const a2 = f.y - e.y;
  const b2 = e.x - f.x;
  const denom = a1 * b2 - a2 * b1;

  if (denom === 0) {
    return null;
  }

  const c1 = b.x * a.y - a.x * b.y;
  const c2 = f.x * e.y - e.x * f.y;
  const point = {
    x: (b1 * c2 - b2 * c1) / denom,
    y: (a2 * c1 - a1 * c2) / denom,
  };

  if (a.x === b.x) point.x = a.x;
  else if (e.x === f.x) point.x = e.x;
  if (a.y === b.y) point.y = a.y;
  else if (e.y === f.y) point.y = e.y;

  return point;
}

export function offsetPolygon(points, offset) {
  const count = points.length;
  const result = [];

  for (let j = 0; j < count; j += 1) {
    let i = j - 1;
    if (i < 0) i += count;
    const k = (j + 1) % count;

    const pre = points[i];
    const cur = points[j];
    const nex = points[k];

    const l1 = distance(cur, pre);
    const n1 = {
      x: (-(cur.y - pre.y) / l1) * offset,
      y: ((cur.x - pre.x) / l1) * offset,
    };

    const l2 = distance(cur, nex);
    const n2 = {
      x: (-(nex.y - cur.y) / l2) * offset,
      y: ((nex.x - cur.x) / l2) * offset,
    };

    const intersection = lineIntersectLine(
      { x: pre.x + n1.x, y: pre.y + n1.y },
      { x: cur.x + n1.x, y: cur.y + n1.y },
      { x: cur.x + n2.x, y: cur.y + n2.y },
      { x: nex.x + n2.x, y: nex.y + n2.y }
    );

    if (intersection) {
      result.push(intersection);
    }
  }

  return result;
}

export function polygonBounds(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
