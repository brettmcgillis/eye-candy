import { buildSpecimen } from '@modules/fungi';

globalThis.onmessage = ({ data }) => {
  const specimen = buildSpecimen(data.params);
  const views = [
    ...Object.values(specimen.mycelium),
    ...specimen.members.flatMap((member) => [
      member.warts,
      ...[...member.keyframes.grow, member.keyframes.rot].flatMap((frame) =>
        Object.values(frame)
      ),
    ]),
  ].filter(ArrayBuffer.isView);
  const buffers = [...new Set(views.map((view) => view.buffer))];

  globalThis.postMessage({ id: data.id, specimen }, buffers);
};
