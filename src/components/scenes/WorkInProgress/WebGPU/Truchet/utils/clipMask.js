import { abs, max, positionWorld, select, smoothstep } from 'three/tsl';

export const CLIP_SHAPE = {
  NONE: 0,
  CIRCLE: 1,
  SQUARE: 2,
};

// 1 inside the clip shape, 0 outside — AA-thresholded so the boundary reads
// clean at any zoom. `patternExtentU` is the pattern's own characteristic
// half-width/radius (computed from grid size in JS); `borderInsetU` (0-1)
// shrinks the visible area within that extent.
export default function clipAlpha({
  borderInsetU,
  clipShapeU,
  patternExtentU,
}) {
  const radius = patternExtentU.mul(borderInsetU.oneMinus());
  const worldXY = positionWorld.xy;
  const circleDist = worldXY.length();
  const squareDist = max(abs(worldXY.x), abs(worldXY.y));
  const dist = select(
    clipShapeU.equal(CLIP_SHAPE.CIRCLE),
    circleDist,
    squareDist
  );
  const aa = dist.fwidth().max(0.001);
  const inside = smoothstep(radius.add(aa), radius.sub(aa), dist);
  return select(clipShapeU.equal(CLIP_SHAPE.NONE), 1, inside);
}
