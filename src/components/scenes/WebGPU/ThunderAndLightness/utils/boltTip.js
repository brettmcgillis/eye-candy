// Position along the trunk polyline at a given propagation distance. The tip is
// what the camera should focus on while the leader is searching; once it has
// landed this settles on the contact point.
export default function sampleBoltTip(trunkPath, arc, out) {
  const count = trunkPath.length / 4;

  if (count === 0) return out;

  for (let index = 1; index < count; index += 1) {
    const previous = trunkPath[(index - 1) * 4 + 3];
    const current = trunkPath[index * 4 + 3];

    if (arc <= current) {
      const span = current - previous;
      const t = span > 0 ? (arc - previous) / span : 0;
      const a = (index - 1) * 4;
      const b = index * 4;

      out.set(
        trunkPath[a] + (trunkPath[b] - trunkPath[a]) * t,
        trunkPath[a + 1] + (trunkPath[b + 1] - trunkPath[a + 1]) * t,
        trunkPath[a + 2] + (trunkPath[b + 2] - trunkPath[a + 2]) * t
      );
      return out;
    }
  }

  const last = (count - 1) * 4;
  out.set(trunkPath[last], trunkPath[last + 1], trunkPath[last + 2]);
  return out;
}
