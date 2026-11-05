export default function authoringSnapshot(value) {
  return JSON.parse(
    JSON.stringify(value, (key, entry) => {
      if (entry?.isVector3) return entry.toArray();
      if (entry?.isEuler)
        return { x: entry.x, y: entry.y, z: entry.z, order: entry.order };
      return entry;
    })
  );
}
