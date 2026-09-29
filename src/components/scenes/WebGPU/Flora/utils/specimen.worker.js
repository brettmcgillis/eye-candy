import { buildSpecimen } from '@modules/flora';

// One message builds every stem of a bouquet (or the one specimen), so a
// bouquet lands whole rather than a flower at a time.
globalThis.onmessage = ({ data }) => {
  const specimens = data.params.map((params) => buildSpecimen(params));
  const buffers = specimens.flatMap((specimen) =>
    [specimen.segments, specimen.cards, ...Object.values(specimen.solids)]
      .flatMap((group) => Object.values(group))
      .filter(ArrayBuffer.isView)
      .map((array) => array.buffer)
  );

  globalThis.postMessage({ id: data.id, specimens }, buffers);
};
