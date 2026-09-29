import { PIXEL_RISE } from './elevation';

export function wellDepth(cell, metrics) {
  return cell.steps * metrics.stairDrop * PIXEL_RISE;
}

function band(cell, index) {
  const { rect, stepFraction } = cell;
  const from = Math.min(index * stepFraction, 1);
  const to = Math.min((index + 1) * stepFraction, 1);
  const [start, end] = cell.descending ? [from, to] : [1 - to, 1 - from];

  return { y: rect.y + start * rect.h, h: (end - start) * rect.h };
}

// Taper is the reference's per-step creep, in its pixels. At zero every tread
// spans the well; above zero the freed strip is either open or walled.
export default function layoutSteps(cell, metrics) {
  const { rect } = cell;
  const floor = -wellDepth(cell, metrics);
  const steps = [];
  const walls = [];

  for (let index = 0; index < cell.steps; index += 1) {
    const inset = Math.min(
      cell.taper * (index + 1) * metrics.stairTaperScale,
      rect.w
    );
    const { y, h } = band(cell, index);
    const top = -index * metrics.stairDrop * PIXEL_RISE;

    if (h <= 0) {
      break;
    }

    if (inset < rect.w) {
      steps.push({
        bottom: floor,
        index: index + 1,
        rect: { x: rect.x + inset, y, w: rect.w - inset, h },
        top,
      });
    }

    if (metrics.stairTaperWall && inset > 0) {
      walls.push({ bottom: floor, rect: { x: rect.x, y, w: inset, h } });
    }
  }

  return { steps, walls };
}
