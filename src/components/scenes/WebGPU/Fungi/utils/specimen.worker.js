import { buildSpecimen } from '@modules/fungi';

globalThis.onmessage = ({ data }) => {
  const specimen = buildSpecimen(data.params);
  const buffers = [
    ...Object.values(specimen.segments),
    ...Object.values(specimen.beads),
    ...Object.values(specimen.mesh),
  ]
    .filter(ArrayBuffer.isView)
    .map((view) => view.buffer);

  globalThis.postMessage({ id: data.id, specimen }, buffers);
};
