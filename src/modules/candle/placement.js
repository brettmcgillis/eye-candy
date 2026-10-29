import { candleToWorld, mirrorEnd } from './framing';

// Flames, smoke and their lights stand upright in the world (a flame points
// up however the candle leans): these are their anchors at the top end, in
// world space. The bottom end's anchors are the same points turned half a
// turn about z (`mirrorEnd`), which is also how its flame and smoke draw.
export default function candlePlacement(config, form) {
  const world = (p) => candleToWorld(config, p);
  const { points, tip } = form.wick;
  const size = config.flameSize ?? 1;
  const base = world(points[0]);
  const mid = world(points[Math.floor(points.length * 0.7)]);
  const tipWorld = world(tip);
  const top = {
    base,
    flameCentre: [tipWorld[0], tipWorld[1] + 0.22 * size, tipWorld[2]],
    flameTip: [tipWorld[0], tipWorld[1] + 0.6 * size, tipWorld[2]],
    mid,
    tip: tipWorld,
  };
  const bottom = Object.fromEntries(
    Object.entries(top).map(([key, p]) => [key, mirrorEnd(p)])
  );
  return { bottom, size, top };
}
