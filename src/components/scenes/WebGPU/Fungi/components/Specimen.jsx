import React, { memo, useEffect, useMemo } from 'react';

import { createSpecimenRig } from '@modules/fungiRender';

import useLifecycle from '../hooks/useLifecycle';

function Specimen({ config, lifecycleApiRef }) {
  const rig = useMemo(() => createSpecimenRig(), []);

  useEffect(() => () => rig.dispose(), [rig]);

  useLifecycle(config, rig, lifecycleApiRef);

  return <primitive object={rig.group} />;
}

export default memo(Specimen);
