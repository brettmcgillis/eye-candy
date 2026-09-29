import { addHatch, addPolyEdges, clipToRect, createLineSet } from './geometry';

const BANDS = 8;

// Lightness picks the spacing in a few discrete bands, so neighbouring cells
// of one pen share spacing and their hatch lines run on through.
export function hatchFor(node, config) {
  if (node.lum > config.hatchSkip) return null;
  const band = Math.min(
    BANDS - 1,
    Math.floor((node.lum / config.hatchSkip) * BANDS)
  );
  const spacing =
    config.hatchMin +
    ((config.hatchMax - config.hatchMin) * band) / (BANDS - 1);
  const angle =
    ((config.hatchAngle + node.stop * config.hatchAngleStep) * Math.PI) / 180;
  return { angle, cross: node.lum < config.hatchCross, spacing };
}

export const OUTLINE_LAYER = -1;

// Pen layers: one per palette stop (hatching), then the outlines. Only leaves
// are drawn unless `nodes` says otherwise (the scene draws every level).
export default function buildPlot(shaded, config, { nodes } = {}) {
  const { height, width } = shaded.canvas;
  const hatches = createLineSet();
  const outlines = createLineSet();

  (nodes ?? shaded.nodes.filter((node) => node.leaf)).forEach((node) => {
    const poly = clipToRect(node.poly, width, height);
    if (!poly) return;
    if (config.plotOutlines) addPolyEdges(outlines, poly, OUTLINE_LAYER);
    const hatch = hatchFor(node, config);
    if (!hatch) return;
    addHatch(hatches, poly, hatch.angle, hatch.spacing, node.stop);
    if (hatch.cross) {
      addHatch(
        hatches,
        poly,
        hatch.angle + Math.PI / 2,
        hatch.spacing,
        node.stop
      );
    }
  });

  return { hatches: hatches.segments(), outlines: outlines.segments() };
}

// One node's pen work, unmerged, for a renderer that shows nodes level by
// level: [{ layer, points }] with OUTLINE_LAYER for the edges.
export function nodeSegments(node, config, canvas) {
  const poly = clipToRect(node.poly, canvas.width, canvas.height);
  if (!poly) return [];
  const set = createLineSet();
  if (config.plotOutlines) addPolyEdges(set, poly, OUTLINE_LAYER);
  const hatch = hatchFor(node, config);
  if (hatch) {
    addHatch(set, poly, hatch.angle, hatch.spacing, node.stop);
    if (hatch.cross) {
      addHatch(set, poly, hatch.angle + Math.PI / 2, hatch.spacing, node.stop);
    }
  }
  return set.segments();
}
