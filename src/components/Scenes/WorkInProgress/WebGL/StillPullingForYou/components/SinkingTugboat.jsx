import React, { useRef } from 'react';

import TugBoat from '../../../../../elements/tugboat/TugBoat';
import BoatLights from './BoatLights';

function SinkingTugboat({ position, rotation, scale, lightConfig }) {
  const headlightMaterialRef = useRef();
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <TugBoat
        headlightMaterialRef={headlightMaterialRef}
        headlightColor={lightConfig.headlightColor}
        headlightEmissiveIntensity={lightConfig.headlightIntensity}
      />
      <BoatLights
        {...lightConfig}
        headlightMaterialRef={headlightMaterialRef}
      />
    </group>
  );
}

export default React.memo(SinkingTugboat);
