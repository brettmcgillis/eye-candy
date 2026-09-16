import React, { memo, useEffect, useMemo } from 'react';

import { SOLID_SHAPES } from '@modules/flora';

import useLifecycle from '../hooks/useLifecycle';
import {
  createCardGeometry,
  createSolidGeometry,
  createTubeGeometry,
} from '../utils/geometry';
import {
  createCardMaterial,
  createSolidMaterial,
} from '../utils/ornamentMaterials';
import createTubeMaterial from '../utils/tubeMaterial';
import { createUniforms, syncUniforms } from '../utils/uniforms';
import InstancedField from './InstancedField';

function Specimen({ config, lifecycleApiRef }) {
  const uniforms = useMemo(createUniforms, []);

  const specimen = useLifecycle(config, uniforms, lifecycleApiRef);

  useEffect(() => {
    syncUniforms(uniforms, config, specimen?.palette);
  }, [config, specimen, uniforms]);

  if (!specimen) {
    return null;
  }

  return (
    <>
      <InstancedField
        buffers={specimen.segments}
        createGeometry={createTubeGeometry}
        createMaterial={createTubeMaterial}
        uniforms={uniforms}
      />
      {SOLID_SHAPES.map((shape) => (
        <InstancedField
          buffers={specimen.solids[shape]}
          createGeometry={createSolidGeometry}
          createMaterial={createSolidMaterial}
          key={shape}
          uniforms={uniforms}
        />
      ))}
      <InstancedField
        buffers={specimen.cards}
        createGeometry={createCardGeometry}
        createMaterial={createCardMaterial}
        uniforms={uniforms}
      />
    </>
  );
}

export default memo(Specimen);
