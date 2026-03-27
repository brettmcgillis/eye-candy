import React from 'react';

import TugBoat from '../../../../../elements/tugboat/TugBoat';
import BoatLights from './BoatLights';

function SinkingTugboat({ position, rotation, scale }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <TugBoat />
      <BoatLights />
    </group>
  );
}

export default React.memo(SinkingTugboat);
