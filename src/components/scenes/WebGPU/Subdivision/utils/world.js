export { LEAF_HIDE } from '@modules/subdivision';

export const WORLD_SCALE = 0.01;

// Canvas px (y down, origin top-left) → the piece group's space (y up,
// centred). The group is scaled to fill the viewport.
export function toWorld(canvas) {
  const hw = canvas.width / 2;
  const hh = canvas.height / 2;
  return (x, y) => [(x - hw) * WORLD_SCALE, (hh - y) * WORLD_SCALE];
}
