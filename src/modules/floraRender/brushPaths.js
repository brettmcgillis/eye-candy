export default function brushPaths(segments) {
  const { count, start, end } = segments;
  const key = (buffer, index) =>
    `${buffer[index * 4]},${buffer[index * 4 + 1]},${buffer[index * 4 + 2]}`;
  const outgoing = new Map();
  const incoming = new Map();
  for (let index = 0; index < count; index += 1) {
    const from = key(start, index);
    const to = key(end, index);
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from).push(index);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }
  const visited = new Uint8Array(count);
  const brush = new Float32Array(count * 4);
  function walk(first) {
    if (visited[first]) return;
    const path = [];
    let index = first;
    let length = 0;
    while (index !== undefined && !visited[index]) {
      visited[index] = 1;
      const offset = index * 4;
      const span = Math.hypot(
        end[offset] - start[offset],
        end[offset + 1] - start[offset + 1],
        end[offset + 2] - start[offset + 2]
      );
      path.push({ index, from: length, to: length + span });
      length += span;
      const at = key(end, index);
      const next = outgoing.get(at);
      index =
        next?.length === 1 && incoming.get(at) === 1 ? next[0] : undefined;
    }
    path.forEach(({ index: segment, from, to }) =>
      brush.set(
        [from / (length || 1), to / (length || 1), first + 1, 0],
        segment * 4
      )
    );
  }
  for (let index = 0; index < count; index += 1) {
    const at = key(start, index);
    if (incoming.get(at) !== 1 || outgoing.get(at)?.length !== 1) walk(index);
  }
  for (let index = 0; index < count; index += 1) walk(index);
  return brush;
}
