function inset(rect, amount) {
  return {
    h: rect.h - amount * 2,
    w: rect.w - amount * 2,
    x: rect.x + amount,
    y: rect.y + amount,
  };
}

function ringStrips(outer, inner) {
  return [
    { x: outer.x, y: outer.y, w: outer.w, h: inner.y - outer.y },
    {
      x: outer.x,
      y: inner.y + inner.h,
      w: outer.w,
      h: outer.y + outer.h - (inner.y + inner.h),
    },
    { x: outer.x, y: inner.y, w: inner.x - outer.x, h: inner.h },
    {
      x: inner.x + inner.w,
      y: inner.y,
      w: outer.x + outer.w - (inner.x + inner.w),
      h: inner.h,
    },
  ];
}

// A terraced pit narrows by one inset per layer. Each ledge is a ring of four
// solid strips standing on the pit floor, so their inner faces are the next
// layer's walls and their tops are the ledges.
export default function terraceRings(rect, layers, step) {
  const rings = [];

  for (let layer = 1; layer < layers; layer += 1) {
    const outer = inset(rect, (layer - 1) * step);
    const inner = inset(rect, layer * step);

    if (inner.w <= 0 || inner.h <= 0) {
      break;
    }

    rings.push({ layer, strips: ringStrips(outer, inner) });
  }

  return rings;
}
