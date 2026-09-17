import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import useFieldSlots from '../hooks/useFieldSlots';
import useLifecycle from '../hooks/useLifecycle';
import {
  createCardMaterial,
  createSolidMaterial,
} from '../utils/ornamentMaterials';
import createTubeMaterial from '../utils/tubeMaterial';
import { createUniforms, syncSpecimen, syncUniforms } from '../utils/uniforms';
import InstancedField from './InstancedField';

function Specimen({ config, lifecycleApiRef }) {
  const uniforms = useMemo(createUniforms, []);
  const { loadSpecimen, slots } = useFieldSlots();
  const configRef = useRef(config);
  const paletteRef = useRef(null);

  configRef.current = config;

  useEffect(() => {
    syncUniforms(uniforms, config, paletteRef.current);
  }, [config, uniforms]);

  const onSpecimen = useCallback(
    (specimen) => {
      loadSpecimen(specimen);
      syncSpecimen(uniforms, specimen);
      paletteRef.current = specimen.palette;
      syncUniforms(uniforms, configRef.current, specimen.palette);
    },
    [loadSpecimen, uniforms]
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
