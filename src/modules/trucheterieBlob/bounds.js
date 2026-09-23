import { familySector } from './laneChannels';

const EMPTY_BOUNDS = { max: [1, 1], min: [-1, -1] };

// Every family only ever draws inside its own cell — a stub's half-disc and a
// corner's quarter-disc both sit within the square — so what it contributes
// is its disc's box clipped to the cell. The unclipped disc overshoots a
// stub's reach by half a cell outward and undershoots nothing, which is what
// pulled every framed field off-centre.
function forEachFamilyBox(field, visit) {
  field.cells.forEach(({ cell, connections }, i) => {
    const centerX = field.centers[i * 2 + 0];
    const centerY = field.centers[i * 2 + 1];
    const gridX = cell.column + cell.size / 2;
    const gridY = cell.row + cell.size / 2;
    const toCanvas = (gx, gy) => [
      centerX + (gx - gridX) * field.cellSize,
      centerY + (gy - gridY) * field.cellSize,
    ];
    connections.forEach(([type, edge]) => {
      const { rMax, x, y } = familySector(cell, type, edge);
      visit(
        toCanvas(Math.max(x - rMax, cell.column), Math.max(y - rMax, cell.row)),
        toCanvas(
          Math.min(x + rMax, cell.column + cell.size),
          Math.min(y + rMax, cell.row + cell.size)
        )
      );
    });
  });
}

// Bounds in the field's own canvas space (`field.centers`, y down), after the
// plane rotation the renderers apply about the canvas origin. The sign is the
// raster's: a positive angle turns the drawing counter-clockwise on screen.
export function canvasBounds(field, rotationDegrees = 0) {
  if (field.count === 0 || field.cells.length === 0) return EMPTY_BOUNDS;
  const angle = (rotationDegrees * Math.PI) / 180;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  forEachFamilyBox(field, ([x0, y0], [x1, y1]) => {
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ].forEach(([x, y]) => {
      const rx = x * c + y * s;
      const ry = y * c - x * s;
      min[0] = Math.min(min[0], rx);
      min[1] = Math.min(min[1], ry);
      max[0] = Math.max(max[0], rx);
      max[1] = Math.max(max[1], ry);
    });
  });
  return { max, min };
}

// The same bounds in the render's world space (`field.positions`, y up).
export default function fieldBounds(field, rotationDegrees = 0) {
  const { max, min } = canvasBounds(field, rotationDegrees);
  return { max: [max[0], -min[1]], min: [min[0], -max[1]] };
}
