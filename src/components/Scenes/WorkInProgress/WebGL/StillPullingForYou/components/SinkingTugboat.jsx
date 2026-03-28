import React from 'react';

import TugBoat from '../../../../../elements/tugboat/TugBoat';
import BoatLights from './BoatLights';

function SinkingTugboat({ position, rotation, scale, lightConfig }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <TugBoat />
      <BoatLights {...lightConfig} />
    </group>
  );
}

export default React.memo(SinkingTugboat);
