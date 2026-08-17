import { button } from 'leva';

import { LANE_MODES, PALETTE_NAMES, PALETTE_NONE } from '../utils/lanePalette';
import { BLOB_PATH } from './controlPaths';

const hasPalette = (get) => get(`${BLOB_PATH}.blobPalette`) !== PALETTE_NONE;

// The blob field's parameters, mirroring the TurtleToy reference's own
// control block one for one (todo.md, "IRREGULAR / BLOB FIELD EXAMPLE") —
// same names, ranges, steps and defaults. `blobCanvasSize` is the one
// addition: the reference hardcodes a 190-unit canvas, which here has to
// become a world size. The lane palette/stroke controls below are this
// scene's own, not the reference's. Keys must match presets/presets.js 1:1.
// `setControlsRef` is a ref rather than the setter itself: Leva builds this
// schema before useControls has returned its setter.
export default function getBlobFieldControls(snapshot, setControlsRef) {
  const saved = snapshot ?? {};
  return {
    blobSeed: {
      label: 'Seed',
      value: saved.blobSeed ?? 'Change me, empty seed means random',
    },
    blobGridSize: {
      label: 'Grid Size',
      max: 50,
      min: 10,
      step: 1,
      value: saved.blobGridSize ?? 25,
    },
    blobCanvasSize: {
      label: 'Canvas Size',
      max: 20,
      min: 1,
      step: 0.1,
      value: saved.blobCanvasSize ?? 8,
    },
    blobPathsPerUnit: {
      label: 'Paths Per Unit',
      max: 20,
      min: 1,
      step: 1,
      value: saved.blobPathsPerUnit ?? 6,
    },
    blobSizeFunction: {
      label: 'Size Function',
      value: saved.blobSizeFunction ?? '1+(gridSize/9)*Math.random()',
    },
    blobDistribution: {
      label: 'Distribution Count',
      max: 1,
      min: 0,
      step: 0.01,
      value: saved.blobDistribution ?? 0.1,
    },
    blobConnectivity: {
      label: 'Connectivity',
      max: 1,
      min: 0,
      step: 0.01,
      value: saved.blobConnectivity ?? 0.95,
    },
    blobOneFill: {
      label: 'One Fill',
      max: 1,
      min: 0,
      step: 0.01,
      value: saved.blobOneFill ?? 0.25,
    },
    blobHoles: {
      label: 'Holes',
      max: 1,
      min: 0,
      step: 0.01,
      value: saved.blobHoles ?? 0,
    },
    blobMeatballs: {
      label: 'Meatballs',
      options: {
        'Not if not connected': 0,
        "I'm a veggie!": 1,
        'Yes please': 2,
      },
      value: saved.blobMeatballs ?? 2,
    },
    blobPalette: {
      label: 'Lane Palette',
      options: PALETTE_NAMES,
      value: saved.blobPalette ?? PALETTE_NONE,
    },
    blobLaneMode: {
      label: 'Lane Colors',
      options: LANE_MODES,
      render: hasPalette,
      value: saved.blobLaneMode ?? 'Cycle',
    },
    blobPaletteExact: {
      label: 'Palette Exact Colors',
      render: hasPalette,
      value: saved.blobPaletteExact ?? true,
    },
    blobPaletteShuffle: {
      label: 'Palette Shuffle Seed',
      max: 999999,
      min: 0,
      render: hasPalette,
      step: 1,
      value: saved.blobPaletteShuffle ?? 0,
    },
    // Leva reads `label`/`render` off the input object, not out of button()'s
    // settings argument — passing them to button() drops both silently.
    shuffleBlobPalette: {
      ...button(() => {
        setControlsRef?.current?.({
          blobPaletteShuffle: Math.floor(Math.random() * 999999) + 1,
        });
      }),
      label: 'Shuffle Palette Colors',
      render: hasPalette,
    },
    blobShowStrokes: {
      label: 'Show Strokes',
      value: saved.blobShowStrokes ?? true,
    },
    blobDebug: {
      label: 'Debug',
      options: { None: 0, Cells: 1, Connections: 2, Both: 3 },
      value: saved.blobDebug ?? 0,
    },
  };
}
