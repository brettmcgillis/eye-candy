import { buildSpecimen } from '@modules/flora';

globalThis.onmessage = ({ data }) => {
  const specimen = buildSpecimen(data.params);
  const buffers = [specimen.segments, specimen.beads, specimen.cards].flatMap(
    (group) =>
      Object.values(group)
        .filter(ArrayBuffer.isView)
        .map((array) => array.buffer)
  );

  globalThis.postMessage({ id: data.id, specimen }, buffers);
};
