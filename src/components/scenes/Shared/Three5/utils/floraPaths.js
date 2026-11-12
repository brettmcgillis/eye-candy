export default function floraPaths(segments, budget) {
  const indices = Array.from({ length: segments.count }, (_, index) => index);
  const wires = indices.filter((index) => segments.start[index * 4 + 3] === 0);
  const structure = indices.filter(
    (index) => segments.start[index * 4 + 3] > 0
  );
  structure.sort(
    (a, b) => segments.start[b * 4 + 3] - segments.start[a * 4 + 3]
  );
  const selected = [
    ...wires.slice(0, Math.floor(budget / 3)),
    ...structure,
  ].slice(0, budget);
  const nodeKey = (buffer, offset) =>
    `${buffer[offset]},${buffer[offset + 1]},${buffer[offset + 2]}`;
  const outgoing = new Map();
  const incoming = new Map();
  let low = Infinity;
  let high = -Infinity;
  selected.forEach((index) => {
    const offset = index * 4;
    const key = nodeKey(segments.start, offset);
    const endKey = nodeKey(segments.end, offset);
    if (!outgoing.has(key)) outgoing.set(key, []);
    outgoing.get(key).push(index);
    incoming.set(endKey, (incoming.get(endKey) || 0) + 1);
    low = Math.min(low, segments.start[offset + 1], segments.end[offset + 1]);
    high = Math.max(high, segments.start[offset + 1], segments.end[offset + 1]);
  });
  const centerY = (low + high) / 2;
  const point = (buffer, index) => [
    buffer[index * 4],
    buffer[index * 4 + 1] - centerY,
    buffer[index * 4 + 2],
  ];
  const visited = new Set();
  const paths = [];
  function walk(first) {
    if (visited.has(first)) return;
    const path = [point(segments.start, first)];
    let index = first;
    while (index !== undefined && !visited.has(index)) {
      visited.add(index);
      path.push(point(segments.end, index));
      const key = nodeKey(segments.end, index * 4);
      const next = outgoing.get(key);
      index =
        next?.length === 1 && incoming.get(key) === 1 ? next[0] : undefined;
    }
    path.width = segments.start[first * 4 + 3] > 0.5 ? 1 : 0.45;
    paths.push(path);
  }
  selected
    .filter((index) => {
      const key = nodeKey(segments.start, index * 4);
      return incoming.get(key) !== 1 || outgoing.get(key)?.length !== 1;
    })
    .forEach(walk);
  selected.forEach(walk);
  return { paths, centerY };
}
