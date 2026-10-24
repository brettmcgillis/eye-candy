import {
  imageSamples,
  inkMap,
  inkRuns,
  nearestInk,
  samplePalette,
} from '@modules/plotKit';

import { formatPath } from './svgProjection';

export default function createPlotColors({ albedo, inks, width }) {
  if (!albedo)
    throw new Error('Flora SVG colors require a surface-color capture.');
  const palette = samplePalette(
    imageSamples({ image: albedo, mask: albedo }),
    inks || 24
  );
  if (!palette.length) return null;
  const map = inkMap({ image: albedo, mask: albedo, palette });
  const ratio = albedo.width / width;
  const nearestColor = nearestInk(palette);
  const at = (x, y) => {
    const px = Math.floor(x * ratio);
    const py = Math.floor(y * ratio);
    for (let radius = 0; radius <= 2; radius += 1) {
      let nearest = -1;
      let distance = Infinity;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const sx = px + dx;
          const sy = py + dy;
          if (sx >= 0 && sy >= 0 && sx < map.width && sy < map.height) {
            const ink = map.ink[sy * map.width + sx];
            const d = dx * dx + dy * dy;
            if (ink >= 0 && d < distance) {
              nearest = ink;
              distance = d;
            }
          }
        }
      }
      if (nearest >= 0) return nearest;
    }
    return -1;
  };
  const recolor = (entries) =>
    entries.flatMap((entry) => {
      const first = entry.points
        .map((p) => at(p.x, p.y))
        .find((ink) => ink >= 0);
      const rgb = [1, 3, 5].map((offset) =>
        parseInt(entry.color.slice(offset, offset + 2), 16)
      );
      let previous = first ?? nearestColor(rgb);
      const runs = inkRuns([entry.points], (x, y) => {
        const ink = at(x, y);
        if (ink >= 0) previous = ink;
        return previous;
      });
      return Object.entries(runs).flatMap(([ink, pieces]) =>
        pieces.map((points) => ({
          ...entry,
          color: palette[ink].color,
          d: formatPath(points),
          points,
        }))
      );
    });
  return { map, palette, recolor };
}
