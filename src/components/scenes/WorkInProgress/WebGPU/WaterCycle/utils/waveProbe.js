import { texture, uniform, vec4 } from 'three/tsl';

export default function createWaveProbe({ cascades, waveLengths }) {
  const lengths = cascades.map((cascade, index) =>
    uniform(waveLengths?.[index] ?? cascade.params.lengthScale)
  );

  const accumulate = (map, channels) => (worldXZ) =>
    cascades
      .map(
        (cascade, index) =>
          texture(cascade[map], worldXZ.div(lengths[index]))[channels]
      )
      .reduce((total, sample) => total.add(sample));

  const displacement = accumulate('displacement', 'xyz');

  return {
    sample: (worldXZ) => {
      const offset = displacement(worldXZ);
      return vec4(
        worldXZ.x.add(offset.x),
        offset.y,
        worldXZ.y.add(offset.z),
        1
      );
    },
    slope: accumulate('derivative', 'xy'),
    setWaveLengths(next) {
      lengths.forEach((_, index) => {
        lengths[index].value = next?.[index] ?? lengths[index].value;
      });
    },
  };
}
