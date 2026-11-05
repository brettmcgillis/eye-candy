import { folder } from 'leva';

export default function seededFolder(entries, snapshot = {}) {
  return folder(
    Object.fromEntries(
      Object.entries(entries).map(([key, entry]) => [
        key,
        Object.hasOwn(snapshot, key)
          ? { ...entry, value: snapshot[key] }
          : entry,
      ])
    ),
    { collapsed: true }
  );
}
