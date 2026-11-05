export default function patchPlotParts(patch, camera, offsets) {
  const p = patch.world.positions;
  return patch.world.ropes.map((rope, id) => {
    const edges = [[], []];
    for (let i = 0; i < rope.count; i += 1) {
      const k = rope.start + i;
      const a = Math.max(rope.start, k - 1) * 3;
      const b = Math.min(rope.start + rope.count - 1, k + 1) * 3;
      const x = p[k * 3];
      const y = p[k * 3 + 1];
      const z = p[k * 3 + 2] + offsets[k];
      const tx = p[b] - p[a];
      const ty = p[b + 1] - p[a + 1];
      const tz = p[b + 2] - p[a + 2];
      const ex = camera.eye[0] - x;
      const ey = camera.eye[1] - y;
      const ez = camera.eye[2] - z;
      const nx = ty * ez - tz * ey;
      const ny = tz * ex - tx * ez;
      const nz = tx * ey - ty * ex;
      const scale = rope.radius / (Math.hypot(nx, ny, nz) || 1);
      edges[0].push([x + nx * scale, y + ny * scale, z + nz * scale]);
      edges[1].push([x - nx * scale, y - ny * scale, z - nz * scale]);
    }
    return { c: patch.cables[id].color, radius: rope.radius, edges };
  });
}
