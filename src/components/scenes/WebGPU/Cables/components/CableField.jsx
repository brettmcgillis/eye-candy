import React, { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { createCablesRig } from '@modules/cablesRender';

import useGeneration from '../hooks/useGeneration';

function CableField({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const rig = useMemo(createCablesRig, []);
  const generation = useGeneration(config);

  useEffect(() => {
    if (generation) rig.setGeneration(generation);
  }, [generation, rig]);

  useEffect(() => {
    rig.apply(config);
    rig.updateEnvironment(gl, scene, config);
  }, [config, gl, rig, scene]);

  useEffect(
    () => () => {
      // eslint-disable-next-line no-param-reassign
      scene.environment = null;
      rig.dispose();
    },
    [rig, scene]
  );

  return <primitive object={rig.group} />;
}

export default memo(CableField);
