import { buildField, buildForm, buildTubeMesh } from '@modules/trucheterie3d';

const CHAIN_ARRAYS = ['cell', 'grow', 'lane', 'points', 'slot', 'u'];
const MEMBRANE_ARRAYS = [
  'crown',
  'index',
  'pinned',
  'rest',
  'sampleOf',
  'side',
  'strips',
  'weldGroups',
  'weldMembers',
];

const buffersOf = ({ membrane, tubes }, mesh) => [
  ...[...tubes.chains, ...(membrane?.chains ?? [])].flatMap((chain) =>
    CHAIN_ARRAYS.filter((name) => chain[name]).map((name) => chain[name].buffer)
  ),
  ...(mesh
    ? ['center', 'index', 'normal', 'position', 'sampleOf'].map(
        (name) => mesh[name].buffer
      )
    : []),
  ...(membrane ? MEMBRANE_ARRAYS.map((name) => membrane[name].buffer) : []),
];

// A field's tube solve and its mesh sweep take seconds at fine settings, so
// the scene builds both here and keeps showing the last tubes until the next land.
function build(data) {
  const field = buildField(data.config);
  const form = buildForm(field, data.config);
  const mesh =
    form.tubes.chains.length > 0
      ? buildTubeMesh(form.tubes, data.config)
      : null;
  globalThis.postMessage(
    {
      field: { cells: field.cells, delays: field.delays },
      id: data.id,
      membrane: form.membrane,
      mesh,
      tubes: form.tubes,
    },
    buffersOf(form, mesh)
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
