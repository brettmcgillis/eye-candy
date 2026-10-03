import buildHoleField from './holeField';
import surfaceNets from './surfaceNets';

function smoothMax(a, b, k) {
  if (k <= 0) return Math.max(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

// The subtraction is done in distance-field space rather than with mesh
// booleans: slab minus noise-cutter is max(slab, -cutter), and a smooth max in
// its place is the fillet round every hole's lip for free.
export default function buildPanelMesh(config, layout) {
  const { panelBevel, panelResolution, panelThickness } = config;
  const { panelHalfHeight, panelHalfWidth } = layout;
  const step = panelResolution;
  const pad = panelBevel + step * 3;
  const origin = [
    -panelHalfWidth - step * 2,
    -panelHalfHeight - step * 2,
    -panelThickness - pad,
  ];
  const nx = Math.ceil((panelHalfWidth * 2 + step * 4) / step) + 1;
  const ny = Math.ceil((panelHalfHeight * 2 + step * 4) / step) + 1;
  const nz = Math.ceil((panelThickness + pad * 2) / step) + 1;

  const holes = buildHoleField({
    cols: nx,
    rows: ny,
    originX: origin[0],
    originY: origin[1],
    step,
    holeScale: config.holeScale,
    holeThreshold: config.holeThreshold,
    holeWarp: config.holeWarp,
    holeMargin: config.holeMargin,
    fieldHalfWidth: layout.fieldHalfWidth,
    fieldHalfHeight: layout.fieldHalfHeight,
    seed: config.holeSeed,
  });

  const values = new Float32Array(nx * ny * nz);
  const centreZ = -panelThickness * 0.5;
  for (let k = 0; k < nz; k += 1) {
    const slab =
      Math.abs(origin[2] + k * step - centreZ) - panelThickness * 0.5;
    for (let j = 0; j < ny; j += 1) {
      const y = Math.abs(origin[1] + j * step) - panelHalfHeight;
      for (let i = 0; i < nx; i += 1) {
        const x = Math.abs(origin[0] + i * step) - panelHalfWidth;
        const solid = Math.max(slab, x, y);
        values[i + j * nx + k * nx * ny] = smoothMax(
          solid,
          -holes[i + j * nx],
          panelBevel
        );
      }
    }
  }

  return surfaceNets({ values, dims: [nx, ny, nz], origin, step });
}
