import React, { memo, useEffect, useMemo } from 'react';

import useLifecycle from '../hooks/useLifecycle';
import {
  createBeadGeometry,
  createCardGeometry,
  createTubeGeometry,
} from '../utils/geometry';
import {
  createBeadMaterial,
  createCardMaterial,
} from '../utils/ornamentMaterials';
import createTubeMaterial from '../utils/tubeMaterial';
import { createUniforms, syncUniforms } from '../utils/uniforms';
import InstancedField from './InstancedField';

function Specimen({ config, lifecycleApiRef }) {
  const uniforms = useMemo(createUniforms, []);

  useEffect(() => {
    syncUniforms(uniforms, config);
  }, [config, uniforms]);

  const specimen = useLifecycle(config, uniforms, lifecycleApiRef);

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
      <InstancedField
        buffers={specimen.beads}
        createGeometry={createBeadGeometry}
        createMaterial={createBeadMaterial}
        uniforms={uniforms}
      />
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
