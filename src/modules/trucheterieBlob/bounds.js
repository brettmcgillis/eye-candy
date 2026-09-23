import { familySector } from './laneChannels';

// A field's world-space bounds (in the render's Y-flipped convention, i.e.
// `field.positions`), for headless/scene framing. A stub/isolated family
// reaches half a cell, but a corner-turn family is centered on a corner
// (already half a cell off-centre) with a radius up to a FULL cell — up to
// 1.5x the cell size from its own cell's centre. Bounding by cell footprint
// alone (`size / 2`) undercuts exactly that family and throws off centering
// for any field that rolls corner turns near its edge.
export default function fieldBounds(field) {
  if (field.count === 0 || field.cells.length === 0) {
    return { max: [1, 1], min: [-1, -1] };
  }
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  field.cells.forEach(({ cell, connections }, i) => {
    const centerX = field.positions[i * 3 + 0];
    const centerY = field.positions[i * 3 + 1];
    const cellCenterGrid = {
      x: cell.column + cell.size / 2,
      y: cell.row + cell.size / 2,
    };
    connections.forEach(([type, edge]) => {
      const sector = familySector(cell, type, edge);
      const dx = (sector.x - cellCenterGrid.x) * field.cellSize;
      // World y is negated relative to grid y (see ./field.js), so the
      // grid-space y offset flips sign too.
      const dy = (sector.y - cellCenterGrid.y) * field.cellSize;
      const radius = sector.rMax * field.cellSize;
      const fx = centerX + dx;
      const fy = centerY - dy;
      min[0] = Math.min(min[0], fx - radius);
      min[1] = Math.min(min[1], fy - radius);
      max[0] = Math.max(max[0], fx + radius);
      max[1] = Math.max(max[1], fy + radius);
    });
  });
  return { max, min };
}
