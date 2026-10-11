import React, { memo } from 'react';

import { BlackHole, BlackHoleLight } from '@modules/blackHole';

function BlackHoleLocation({ config }) {
  return (
    <>
      <BlackHole config={config} />
      {config.blackHoleLightEnabled && (
        <BlackHoleLight
          key={config.blackHoleVariant}
          color={config.blackHoleLightColor}
          config={config}
          intensity={config.blackHoleLightIntensity}
          vividness={config.blackHoleLightVividness}
        />
      )}
    </>
  );
}

export default memo(BlackHoleLocation);
