import buildTubes, { tubeRadii } from './buildTubes';
import buildMembrane, { membraneActive } from './membrane';

// What a config draws: tubes, or a membrane over the lanes with any wires
// solved alone, capped and flat, so they lie in its seams as piping.
export default function buildForm(field, config) {
  if (!membraneActive(config)) {
    return { membrane: null, tubes: buildTubes(field, config) };
  }
  const membrane = buildMembrane(field, config);
  if (config.strands === 'both') {
    const wires = { ...config, heightMode: 'flat', junction: 'cap' };
    return {
      membrane,
      tubes: buildTubes(field, { ...wires, strands: 'wires' }),
    };
  }
  return {
    membrane,
    tubes: {
      chains: [],
      gridSize: membrane.gridSize,
      pitch: membrane.pitch,
      radii: tubeRadii(config),
      stats: {},
    },
  };
}
