export function proximityNeighbors(points, radius) {
  const cell = (v) => Math.floor(v / radius);
  const grid = new Map();
  points.forEach((p, i) => {
    const key = `${cell(p.x)}:${cell(p.y)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  });
  const limit = radius * radius;
  return points.map((p, i) => {
    const found = [];
    for (let dx = -1; dx <= 1; dx += 1)
      for (let dy = -1; dy <= 1; dy += 1)
        grid.get(`${cell(p.x) + dx}:${cell(p.y) + dy}`)?.forEach((j) => {
          if (
            j !== i &&
            (points[j].x - p.x) ** 2 + (points[j].y - p.y) ** 2 <= limit
          )
            found.push(j);
        });
    return Int32Array.from(found.sort((a, b) => a - b));
  });
}

export function nearestDistance(points) {
  let best = Infinity;
  points.forEach((p, i) => {
    for (let j = i + 1; j < points.length; j += 1)
      best = Math.min(best, Math.hypot(points[j].x - p.x, points[j].y - p.y));
  });
  return best;
}
