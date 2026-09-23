import React, { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { createSpecimenRig } from '@modules/fungiRender';

import useLifecycle from '../hooks/useLifecycle';

function Specimen({ config, lifecycleApiRef }) {
  const rig = useMemo(() => createSpecimenRig(), []);
  const renderer = useThree((state) => state.gl);

  rig.setRenderer(renderer);

  useEffect(() => () => rig.dispose(), [rig]);

  useLifecycle(config, rig, lifecycleApiRef);

  return <primitive object={rig.group} />;
}

export default memo(Specimen);
