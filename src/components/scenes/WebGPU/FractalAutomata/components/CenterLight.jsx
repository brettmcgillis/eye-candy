import React, { memo, useEffect, useMemo } from 'react';

import { createCenterLight } from '@modules/fractalAutomataRender';

function CenterLight({ config, lightRef }) {
  const rig = useMemo(() => createCenterLight(), []);

  // eslint-disable-next-line no-param-reassign
  lightRef.current = rig.light;

  useEffect(() => {
    rig.apply(config);
  }, [
    rig,
    config.godraysColor,
    config.godraysIntensity,
    config.godraysPosition,
    config.godraysVolumeSize,
  ]);

  useEffect(() => () => rig.dispose(), [rig]);

  return <primitive object={rig.group} />;
}

export default memo(CenterLight);
