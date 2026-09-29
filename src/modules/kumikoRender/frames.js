import { TIER } from '@modules/kumiko';

import { MM, createPrismBuilder, hexToLinear, toWorld } from './prism';

// Top and bottom of each tier in world units: the jigumi runs the full
// depth, the infill is set back from the face by the recess.
export function tierDepths(config) {
  const top = config.jigumiDepth;
  const face = Math.max(0.5, top - config.infillRecess);
  const detail = Math.max(0.5, top - config.infillRecess * 1.6);
  const span = (z1) => [Math.max(0, z1 - config.infillDepth) * MM, z1 * MM];
  return {
    [TIER.jigumi]: [0, top * MM],
    [TIER.infill]: span(face),
    [TIER.detail]: span(detail),
  };
}

const ring = ([x0, y0, x1, y1], w) => [
  [x0 - w, y0 - w, x1 + w, y0],
  [x0 - w, y1, x1 + w, y1 + w],
  [x0 - w, y0, x0, y1],
  [x1, y0, x1 + w, y1],
];

const quad = ([x0, y0, x1, y1]) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

// The outer kamachi and any nested frames. The border stands proud of the
// lattice and hides the cells that run on under it to the panel's edge.
export function buildFrames(panel, config) {
  const world = toWorld(panel);
  const builder = createPrismBuilder({ grain: true });
  const top = config.jigumiDepth;
  const along = ([x0, y0, x1, y1], k) =>
    x1 - x0 > y1 - y0 ? [1, 0, k * 11] : [0, 1, k * 11];
  ring(panel.inner, config.borderWidth).forEach((r, k) =>
    builder.add(
      quad(r).map(world),
      (top - config.borderDepth) * MM,
      (top + 3) * MM,
      undefined,
      along(r, k)
    )
  );
  panel.frames.forEach(({ rect, width }) => {
    const h = width / 2;
    const inner = [rect[0] + h, rect[1] + h, rect[2] - h, rect[3] - h];
    ring(inner, width).forEach((r, k) =>
      builder.add(
        quad(r).map(world),
        0,
        (top + 1.5) * MM,
        undefined,
        along(r, k + 4)
      )
    );
  });
  return builder.build();
}

export function buildBasePaper(panel, config) {
  const builder = createPrismBuilder({ colors: true });
  builder.add(
    quad(panel.inner).map(toWorld(panel)),
    -0.9 * MM,
    -0.7 * MM,
    hexToLinear(config.paperColor)
  );
  return builder.build();
}
