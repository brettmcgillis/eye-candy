import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { MAX_SEED, createMotion } from '@modules/nestingBoxes';
import {
  MAP_SLOTS,
  SURFACES,
  SURFACE_URLS,
  configureSurfaceTexture,
  createBoxRig,
} from '@modules/nestingBoxesRender';

useTexture.preload(SURFACE_URLS);

function BoxTree({ config }) {
  const configRef = useRef(config);
  const cycleRef = useRef(0);
  configRef.current = config;

  const loaded = useTexture(SURFACE_URLS);
  const rig = useMemo(createBoxRig, []);
  const motion = useMemo(createMotion, []);

  const surfaceMaps = useMemo(() => {
    const byUrl = Object.fromEntries(
      SURFACE_URLS.map((url, i) => [url, loaded[i]])
    );
    return Object.fromEntries(
      Object.entries(SURFACES).map(([name, urls]) => [
        name,
        Object.fromEntries(
          MAP_SLOTS.filter((slot) => urls[slot]).map((slot) => {
            const texture = byUrl[urls[slot]];
            configureSurfaceTexture(texture, slot);
            return [slot, texture];
          })
        ),
      ])
    );
  }, [loaded]);

  useEffect(() => {
    rig.setSurfaceMaps(surfaceMaps[config.surface] ?? surfaceMaps.Plain);
  }, [rig, config.surface, surfaceMaps]);

  useEffect(() => {
    rig.setPalette(config.paletteName, config.paletteExact);
  }, [rig, config.paletteExact, config.paletteName]);

  useEffect(() => () => rig.dispose(), [rig]);

  useFrame((state, delta) => {
    const c = configRef.current;
    const drift = motion.drift(c, delta);
    const progress = motion.grow(c, delta, c.growReplayRef.current);
    const cycle = motion.growCycle(c);
    if (cycle !== cycleRef.current) {
      cycleRef.current = cycle;
      if (c.growNewSeed && cycle > 0) {
        c.setControlsRef.current?.({
          seed: Math.floor(Math.random() * (MAX_SEED + 1)),
        });
      }
    }
    rig.apply(c, { drift, progress });
    rig.compute(state.gl);
  });

  return <primitive object={rig.mesh} />;
}

export default memo(BoxTree);
