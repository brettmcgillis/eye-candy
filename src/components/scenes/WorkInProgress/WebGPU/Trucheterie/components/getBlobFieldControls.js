// The blob field's parameters, mirroring the TurtleToy reference's own
// control block one for one (todo.md, "IRREGULAR / BLOB FIELD EXAMPLE") —
// same names, ranges, steps and defaults. `blobCanvasSize` is the one
// addition: the reference hardcodes a 190-unit canvas, which here has to
// become a world size. Keys must match presets/presets.js 1:1.
export default function getBlobFieldControls(snapshot = {}) {
  return {
    blobSeed: {
      label: 'Seed',
      value: snapshot.blobSeed ?? 'Change me, empty seed means random',
    },
    blobGridSize: {
      label: 'Grid Size',
      max: 50,
      min: 10,
      step: 1,
      value: snapshot.blobGridSize ?? 25,
    },
    blobCanvasSize: {
      label: 'Canvas Size',
      max: 20,
      min: 1,
      step: 0.1,
      value: snapshot.blobCanvasSize ?? 8,
    },
    blobPathsPerUnit: {
      label: 'Paths Per Unit',
      max: 20,
      min: 1,
      step: 1,
      value: snapshot.blobPathsPerUnit ?? 6,
    },
    blobSizeFunction: {
      label: 'Size Function',
      value: snapshot.blobSizeFunction ?? '1+(gridSize/9)*Math.random()',
    },
    blobDistribution: {
      label: 'Distribution Count',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.blobDistribution ?? 0.1,
    },
    blobConnectivity: {
      label: 'Connectivity',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.blobConnectivity ?? 0.95,
    },
    blobOneFill: {
      label: 'One Fill',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.blobOneFill ?? 0.25,
    },
    blobHoles: {
      label: 'Holes',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.blobHoles ?? 0,
    },
    blobMeatballs: {
      label: 'Meatballs',
      options: {
        'Not if not connected': 0,
        "I'm a veggie!": 1,
        'Yes please': 2,
      },
      value: snapshot.blobMeatballs ?? 2,
    },
    blobDebug: {
      label: 'Debug',
      options: { None: 0, Cells: 1, Connections: 2, Both: 3 },
      value: snapshot.blobDebug ?? 0,
    },
  };
}
