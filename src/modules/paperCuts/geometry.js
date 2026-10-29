export const overlaps = (a, b) =>
  a.position.every(
    (v, axis) => Math.abs(v - b.position[axis]) < (a.size + b.size) / 2 - 1e-8
  );

export function coveredArea(square, nearer) {
  const [x, y] = square.position;
  const h = square.size / 2;
  const clips = nearer
    .filter((s) => overlaps(square, s))
    .map((s) => ({
      x0: Math.max(x - h, s.position[0] - s.size / 2),
      x1: Math.min(x + h, s.position[0] + s.size / 2),
      y0: Math.max(y - h, s.position[1] - s.size / 2),
      y1: Math.min(y + h, s.position[1] + s.size / 2),
    }));
  const xs = [...new Set(clips.flatMap((r) => [r.x0, r.x1]))].sort(
    (a, b) => a - b
  );
  let area = 0;
  xs.slice(1).forEach((right, i) => {
    const left = xs[i];
    const intervals = clips
      .filter((r) => r.x0 <= left && r.x1 >= right)
      .sort((a, b) => a.y0 - b.y0);
    let end = -Infinity;
    intervals.forEach((r) => {
      area += (right - left) * Math.max(0, r.y1 - Math.max(end, r.y0));
      end = Math.max(end, r.y1);
    });
  });
  return area;
}

export function orbitOf(position, symmetry) {
  const [x, y] = position;
  const positions = [
    [x, y],
    [-x, -y],
  ];
  if (symmetry === 'quarterTurn') positions.push([-y, x], [y, -x]);
  return [...new Map(positions.map((p) => [p.join(','), p])).values()];
}

export function colorAt(start, end, t) {
  const channels = [1, 3, 5].map((i) => {
    const a = parseInt(start.slice(i, i + 2), 16);
    const b = parseInt(end.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`;
}
