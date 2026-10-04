import { buildField, buildTubeMesh, buildTubes } from '@modules/trucheterie3d';

const buffersOf = (tubes, mesh) => [
  ...tubes.chains.flatMap((chain) =>
    ['cell', 'grow', 'lane', 'points', 'slot', 'u'].map(
      (name) => chain[name].buffer
    )
  ),
  ...['center', 'index', 'normal', 'position', 'sampleOf'].map(
    (name) => mesh[name].buffer
  ),
];

// A field's tube solve and its mesh sweep take seconds at fine settings, so
// the scene builds both here and keeps showing the last tubes until the next land.
function build(data) {
  const field = buildField(data.config);
  const tubes = buildTubes(field, data.config);
  const mesh = buildTubeMesh(tubes, data.config);
  globalThis.postMessage(
    {
      field: { cells: field.cells, delays: field.delays },
      id: data.id,
      mesh,
      tubes,
    },
    buffersOf(tubes, mesh)
  );
}

globalThis.onmessage = ({ data }) => {
  try {
    build(data);
  } catch (error) {
    globalThis.postMessage({
      error: String(error?.stack ?? error),
      id: data.id,
    });
  }
};
