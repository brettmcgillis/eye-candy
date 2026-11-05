export default function resolvePresetControls({
  currentControls,
  getPresetControls,
  presetName,
  presetSnapshot,
}) {
  const adapted = getPresetControls({
    currentControls,
    presetName,
    presetSnapshot,
  });
  if (!adapted) return null;
  const savedControls = Object.fromEntries(
    Object.keys(currentControls)
      .filter((key) => Object.hasOwn(presetSnapshot, key))
      .map((key) => [key, presetSnapshot[key]])
  );
  return { ...adapted, ...savedControls };
}

export function persistPresetControls(schema) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, entry]) => {
      if (entry?.schema)
        return [key, { ...entry, schema: persistPresetControls(entry.schema) }];
      if (
        key !== 'preset' &&
        entry?.onChange &&
        Object.hasOwn(entry, 'value')
      ) {
        return [key, { ...entry, transient: false }];
      }
      return [key, entry];
    })
  );
}
