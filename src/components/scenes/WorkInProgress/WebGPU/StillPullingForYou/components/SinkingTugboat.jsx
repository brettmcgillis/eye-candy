import React, { useRef } from 'react';

import TugBoat from '../../../../../elements/tugboat/TugBoat';
import BoatLights from './BoatLights';

function SinkingTugboat({
  position,
  rotation,
  scale,
  flagAnchorRef,
  lightConfig,
  showUpperDeckFlag = true,
  smokeAnchorRef,
}) {
  const headlightMaterialRef = useRef();
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <TugBoat
        flagAnchorRef={flagAnchorRef}
        headlightMaterialRef={headlightMaterialRef}
        headlightColor={lightConfig.headlightColor}
        headlightEmissiveIntensity={lightConfig.headlightIntensity}
        showUpperDeckFlag={showUpperDeckFlag}
        smokeAnchorRef={smokeAnchorRef}
      />
      <BoatLights
        {...lightConfig}
        headlightMaterialRef={headlightMaterialRef}
      />
    </group>
  );
}

export default React.memo(SinkingTugboat);
