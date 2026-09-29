import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { arrangeBouquet, bouquetStyleFor } from '@modules/flora';
import { createSpecimenRig, placeFlower } from '@modules/floraRender';

import useLifecycle from '../hooks/useLifecycle';

const ARRANGEMENT_KEYS = [
  'bouquetGap',
  'bouquetJitter',
  'bouquetSpread',
  'bouquetStyle',
  'bouquetTie',
];

function placementsFor({ bouquet, members, seed }, config) {
  if (!bouquet) return [null];

  return arrangeBouquet(
    members.map(({ specimen }) => ({
      center: specimen.center,
      crownRadius: specimen.crownRadius,
      height: specimen.height,
    })),
    {
      gap: config.bouquetGap,
      jitter: config.bouquetJitter,
      seed,
      spread: config.bouquetSpread,
      style: bouquetStyleFor(config.bouquetStyle, seed),
      tie: config.bouquetTie,
    }
  );
}

// Every stem is a rig from @modules/floraRender — the same one the CLI draws
// with — each owning its uniforms, so stems can hold different looks. Rigs are
// pooled and never leave the GPU; a smaller bouquet only unparents the rest.
function Bouquet({ config, lifecycleApiRef }) {
  const groupRef = useRef(null);
  const rigs = useMemo(() => [createSpecimenRig()], []);
  const bouquetRef = useRef(null);
  const configRef = useRef(config);

  configRef.current = config;

  const syncLooks = useCallback(() => {
    const members = bouquetRef.current?.members ?? [{ overrides: {} }];

    members.forEach(({ overrides }, index) => {
      rigs[index].setConfig({ ...configRef.current, ...overrides });
    });
  }, [rigs]);

  const place = useCallback(() => {
    const bouquet = bouquetRef.current;

    if (!bouquet) return;

    placementsFor(bouquet, configRef.current).forEach((placement, index) => {
      placeFlower(rigs[index].group, placement);
    });
  }, [rigs]);

  useEffect(() => {
    const group = groupRef.current;

    group.add(rigs[0].group);

    return () => rigs.forEach((rig) => rig.dispose());
  }, [rigs]);

  // Stems a bigger bouquet will need are parented while it builds, so their
  // materials compile before the swap instead of on it. A fresh rig draws
  // nothing until it is loaded.
  useEffect(() => {
    while (rigs.length < config.bouquetSize) {
      const rig = createSpecimenRig();

      rigs.push(rig);
      groupRef.current.add(rig.group);
    }
  }, [config.bouquetSize, rigs]);

  useEffect(() => {
    syncLooks();
  }, [config, syncLooks]);

  const arrangementKey = JSON.stringify(
    ARRANGEMENT_KEYS.map((key) => config[key])
  );

  useEffect(() => {
    place();
  }, [arrangementKey, place]);

  const onBouquet = useCallback(
    (bouquet) => {
      const { members } = bouquet;

      bouquetRef.current = bouquet;

      while (rigs.length < members.length) {
        rigs.push(createSpecimenRig());
      }

      rigs.forEach((rig, index) => {
        if (index < members.length) {
          rig.load(members[index].specimen);
          groupRef.current.add(rig.group);
        } else {
          rig.group.removeFromParent();
        }
      });

      syncLooks();
      place();
    },
    [place, rigs, syncLooks]
  );

  const onLevels = useCallback(
    (levels) => {
      const count = bouquetRef.current?.members.length ?? 1;

      for (let index = 0; index < count; index += 1) {
        rigs[index].setLevels(levels);
      }
    },
    [rigs]
  );

  useLifecycle(config, lifecycleApiRef, { onBouquet, onLevels });

  return <group ref={groupRef} />;
}

export default memo(Bouquet);
