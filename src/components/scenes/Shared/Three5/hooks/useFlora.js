import { useMemo } from 'react';

import { buildSpecimen } from '@modules/flora';

import floraPaths from '../utils/floraPaths';

export default function useFlora(config) {
  const specimen = useMemo(
    () =>
      buildSpecimen({
        seed: String(config.seed),
        crownForm: config.floraForm,
        tips: config.floraTips,
        maxSegments: 10000,
        stemHeight: 4,
        crownRadius: 1.8,
        sideShoots: 0,
        ornamentDensity: 0.5,
        ornamentSize: 0.14,
        sphereAmount: 0.5,
        d8Amount: 0.4,
        d8Wire: 0.65,
        sphereWire: 0,
        petalAmount: 0.3,
      }),
    [config.seed, config.floraForm, config.floraTips]
  );

  return useMemo(() => {
    const { segments } = specimen;
    const { paths, centerY } = floraPaths(segments, config.floraBudget);
    const solidItems = Object.values(specimen.solids).flatMap((group) =>
      Array.from({ length: group.count }, (_, index) => {
        const offset = index * 4;
        return {
          position: [
            group.position[offset],
            group.position[offset + 1] - centerY,
            group.position[offset + 2],
          ],
          shape: group.shape,
          size: group.position[offset + 3],
          birth: group.info[offset],
        };
      })
    );
    const cards = Array.from({ length: specimen.cards.count }, (_, index) => {
      const offset = index * 4;
      return {
        shape: 'petal',
        position: [
          specimen.cards.position[offset],
          specimen.cards.position[offset + 1] - centerY,
          specimen.cards.position[offset + 2],
        ],
        direction: Array.from(specimen.cards.dir.slice(offset, offset + 3)),
        size: specimen.cards.position[offset + 3],
        birth: specimen.cards.dir[offset + 3],
      };
    });
    const ornaments = [...solidItems, ...cards].slice(0, config.floraSolids);
    return { paths, ornaments, total: segments.count };
  }, [specimen, config.floraBudget, config.floraSolids]);
}
