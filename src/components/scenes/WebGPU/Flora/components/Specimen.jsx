import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import {
  applyPalette,
  createCardMaterial,
  createPaletteCache,
  createSolidMaterial,
  createTubeMaterial,
  createUniforms,
  resolvePaletteName,
  syncSpecimen,
  syncUniforms,
} from '@modules/floraRender';

import useFieldSlots from '../hooks/useFieldSlots';
import useLifecycle from '../hooks/useLifecycle';
import InstancedField from './InstancedField';

function Specimen({ config, lifecycleApiRef }) {
  const uniforms = useMemo(createUniforms, []);
  const { loadSpecimen, slots } = useFieldSlots();
  const configRef = useRef(config);
  const paletteRef = useRef(null);
  const paletteCache = useMemo(createPaletteCache, []);

  configRef.current = config;

  const syncColors = useCallback(
    (current, palette) => {
      syncUniforms(uniforms, current, palette);
      applyPalette(
        uniforms,
        paletteCache,
        resolvePaletteName(current, palette),
        current.paletteExact
      );
    },
    [paletteCache, uniforms]
  );

  useEffect(() => () => paletteCache.dispose(), [paletteCache]);

  useEffect(() => {
    syncColors(config, paletteRef.current);
  }, [config, syncColors]);

  const onSpecimen = useCallback(
    (specimen) => {
      loadSpecimen(specimen);
      syncSpecimen(uniforms, specimen);
      paletteRef.current = specimen.palette;
      syncColors(configRef.current, specimen.palette);
    },
    [loadSpecimen, syncColors, uniforms]
  );

  useLifecycle(config, uniforms, lifecycleApiRef, onSpecimen);

  return (
    <>
      <InstancedField
        createMaterial={createTubeMaterial}
        slot={slots.tube}
        uniforms={uniforms}
      />
      {slots.solids.map((slot) => (
        <InstancedField
          createMaterial={createSolidMaterial}
          key={slot.key}
          slot={slot}
          uniforms={uniforms}
        />
      ))}
      <InstancedField
        createMaterial={createCardMaterial}
        slot={slots.cards}
        uniforms={uniforms}
      />
    </>
  );
}

export default memo(Specimen);
