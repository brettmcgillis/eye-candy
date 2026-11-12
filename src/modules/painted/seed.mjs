/* eslint-disable no-bitwise */
export default function hashPaintSeed(value) {
  return (
    Array.from(String(value)).reduce(
      (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
      2166136261
    ) >>> 0
  );
}
