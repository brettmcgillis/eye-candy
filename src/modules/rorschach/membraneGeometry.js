import * as THREE from 'three/webgpu';

// The canopy stretched over a bundle's strands. A bundle is already a
// parametric grid — (u = strand index, v = step index) — so this is a loft
// over data the integrator has already produced, not new simulation.
//
// Two sheets per bundle, one per side of the X=0 fold, sharing one buffer.
// Vertices are laid out row-major and indices are emitted row-major to match,
// so a single setDrawRange sweep grows the membrane in lockstep with the
// strokes (see buildStrokeGeometry.js, same trick).
//
// Only meaningful for line-seeded bundles: over the default RNG scatter the
// strand order is not a spatial order, so the loft self-crosses. See
// testGenerator.js's seedStartPoints.
//
// A row is not necessarily a step and a column is not necessarily a strand —
// see membraneLayout for the strides.

export const SHEETS_PER_BUNDLE = 2;

// Which source strands each panel spans.
//
// `strandStride` > 1 lofts across wider gaps than the strand spacing, giving
// one coarser sheet over bigger plates. `weave` then lofts *every* offset
// rather than only the first, so the strands that stride skipped carry their
// own interleaved panels and the result reads as webbing with open slots
// between overlapping sheets rather than as a single coarse surface. Stride 2
// with weave on is the i -> i+2 lattice.
export function membranePanels(strandCount, strandStride = 1, weave = false) {
  const stride = Math.max(1, Math.floor(strandStride));
  const offsets = weave ? stride : 1;
  const panels = [];
  for (let offset = 0; offset < offsets; offset += 1) {
    const columns = [];
    for (let c = offset; c < strandCount; c += stride) columns.push(c);
    // A one-strand panel spans nothing; dropping it here keeps every seam in
    // `quadStarts` a real quad.
    if (columns.length >= 2) panels.push(columns);
  }
  return panels;
}

// Flattens the panels into the column slots the buffers are actually indexed
// by, and precomputes everything the write and draw-range paths need so
// neither has to re-derive the layout per frame.
export function membraneLayout(strandCount, steps, options = {}) {
  const stepStride = Math.max(1, Math.floor(options.stepStride ?? 1));
  const panels = membranePanels(
    strandCount,
    options.strandStride,
    options.weave
  );
  const columns = panels.flat();
  const columnCount = columns.length;
  const rows =
    columnCount >= 2 && steps >= 2
      ? Math.floor((steps - 1) / stepStride) + 1
      : 0;

  // Left slot of every quad. Panel seams are skipped, so a quad never bridges
  // two interleaved webs.
  const quadStarts = [];
  // Neighbouring slots within the same panel, for the tear gap; -1 at a panel
  // edge. The tear has to measure the span actually being bridged, not the
  // spacing of the underlying strands, or a strided sheet would tear at a
  // threshold meant for a denser one.
  const slotPrev = new Int32Array(columnCount).fill(-1);
  const slotNext = new Int32Array(columnCount).fill(-1);
  // 0 on a panel's two boundary strands, 1 down its middle — each web gets its
  // own feather ramp rather than one ramp across the whole bundle.
  const slotEdgeU = new Float32Array(columnCount);

  let base = 0;
  panels.forEach((panelColumns) => {
    const halfSpan = Math.max((panelColumns.length - 1) / 2, 1);
    for (let k = 0; k < panelColumns.length; k += 1) {
      const slot = base + k;
      if (k > 0) slotPrev[slot] = slot - 1;
      if (k < panelColumns.length - 1) {
        slotNext[slot] = slot + 1;
        quadStarts.push(slot);
      }
      slotEdgeU[slot] = Math.min(k, panelColumns.length - 1 - k) / halfSpan;
    }
    base += panelColumns.length;
  });

  return {
    columnCount,
    columns,
    indicesPerRow: SHEETS_PER_BUNDLE * quadStarts.length * 6,
    quadStarts,
    rows,
    slotEdgeU,
    slotNext,
    slotPrev,
    stepStride,
  };
}

function vertexIndex(row, sheet, slot, columnCount) {
  return row * SHEETS_PER_BUNDLE * columnCount + sheet * columnCount + slot;
}

export function buildMembraneGeometry(strandCount, steps, options = {}) {
  const geometry = new THREE.BufferGeometry();
  const layout = membraneLayout(strandCount, steps, options);
  const { columnCount, quadStarts, rows } = layout;

  geometry.userData.membrane = layout;
  if (rows < 2 || quadStarts.length === 0) {
    geometry.setDrawRange(0, 0);
    return geometry;
  }

  const vertexCount = rows * SHEETS_PER_BUNDLE * columnCount;
  const position = new THREE.BufferAttribute(
    new Float32Array(vertexCount * 3),
    3
  );
  // Distance to this vertex's widest in-panel neighbour — the tear test.
  const edgeLength = new THREE.BufferAttribute(
    new Float32Array(vertexCount),
    1
  );
  // The source step, not the row — the trail fade and taper both measure
  // against step counts, which stride must not rescale.
  const stepIndex = new THREE.BufferAttribute(new Float32Array(vertexCount), 1);
  const edgeU = new THREE.BufferAttribute(new Float32Array(vertexCount), 1);
  position.setUsage(THREE.DynamicDrawUsage);
  edgeLength.setUsage(THREE.DynamicDrawUsage);

  for (let row = 0; row < rows; row += 1) {
    for (let sheet = 0; sheet < SHEETS_PER_BUNDLE; sheet += 1) {
      for (let slot = 0; slot < columnCount; slot += 1) {
        const vi = vertexIndex(row, sheet, slot, columnCount);
        stepIndex.setX(vi, row * layout.stepStride);
        edgeU.setX(vi, layout.slotEdgeU[slot]);
      }
    }
  }

  const indices = new Uint32Array((rows - 1) * layout.indicesPerRow);
  let i = 0;
  for (let row = 0; row < rows - 1; row += 1) {
    for (let sheet = 0; sheet < SHEETS_PER_BUNDLE; sheet += 1) {
      for (let q = 0; q < quadStarts.length; q += 1) {
        const slot = quadStarts[q];
        const a = vertexIndex(row, sheet, slot, columnCount);
        const b = vertexIndex(row, sheet, slot + 1, columnCount);
        const d = vertexIndex(row + 1, sheet, slot, columnCount);
        const e = vertexIndex(row + 1, sheet, slot + 1, columnCount);
        // The mirror sheet is the primary negated in X, so its winding is
        // reversed — flipped back here to keep both sheets front-facing.
        if (sheet === 0) {
          indices[i] = a;
          indices[i + 1] = d;
          indices[i + 2] = b;
          indices[i + 3] = b;
          indices[i + 4] = d;
          indices[i + 5] = e;
        } else {
          indices[i] = a;
          indices[i + 1] = b;
          indices[i + 2] = d;
          indices[i + 3] = b;
          indices[i + 4] = e;
          indices[i + 5] = d;
        }
        i += 6;
      }
    }
  }

  geometry.setAttribute('position', position);
  geometry.setAttribute('edgeLength', edgeLength);
  geometry.setAttribute('stepIndex', stepIndex);
  geometry.setAttribute('edgeU', edgeU);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setDrawRange(0, 0);
  return geometry;
}

// Writes vertex rows for steps [fromStep, toStep] inclusive — the endpoints of
// the segment range writeStrokeSegmentRange is called with, so both can take
// the same arguments. Under a step stride the range may cover no rows at all,
// which is why callers append rather than assuming one row per call.
export function writeMembraneRange(geometry, strands, fromStep, toStep) {
  const { position, edgeLength } = geometry.attributes;
  const layout = geometry.userData.membrane;
  if (!position || !layout || layout.rows < 2) return;

  const { columnCount, columns, rows, slotNext, slotPrev, stepStride } = layout;
  const rowFrom = Math.ceil(Math.max(0, fromStep) / stepStride);
  const rowTo = Math.min(rows - 1, Math.floor(toStep / stepStride));

  for (let row = rowFrom; row <= rowTo; row += 1) {
    const o = row * stepStride * 3;
    for (let slot = 0; slot < columnCount; slot += 1) {
      const primary = strands[columns[slot] * 2];
      const x = primary[o];
      const y = primary[o + 1];
      const z = primary[o + 2];
      position.setXYZ(vertexIndex(row, 0, slot, columnCount), x, y, z);
      position.setXYZ(vertexIndex(row, 1, slot, columnCount), -x, y, z);

      const gapTo = (neighbourSlot) => {
        if (neighbourSlot < 0) return 0;
        const neighbour = strands[columns[neighbourSlot] * 2];
        return Math.hypot(
          neighbour[o] - x,
          neighbour[o + 1] - y,
          neighbour[o + 2] - z
        );
      };
      const widest = Math.max(gapTo(slotPrev[slot]), gapTo(slotNext[slot]));
      // Both sheets are the same distances apart — the fold only negates X.
      edgeLength.setX(vertexIndex(row, 0, slot, columnCount), widest);
      edgeLength.setX(vertexIndex(row, 1, slot, columnCount), widest);
    }
  }

  position.needsUpdate = true;
  edgeLength.needsUpdate = true;
}

export function writeMembranePositions(geometry, strands, steps) {
  writeMembraneRange(geometry, strands, 0, steps - 1);
}

// `strandCount` is unused now that the layout travels with the geometry, but
// stays in the signature so both renderers' call sites read the same.
export function setMembraneDrawRange(geometry, strandCount, revealedSteps) {
  const layout = geometry.userData.membrane;
  if (!geometry.index || !layout) return;
  const revealedRows = Math.min(
    layout.rows,
    Math.floor(Math.max(0, revealedSteps - 1) / layout.stepStride) + 1
  );
  geometry.setDrawRange(
    0,
    Math.max(0, revealedRows - 1) * layout.indicesPerRow
  );
}
