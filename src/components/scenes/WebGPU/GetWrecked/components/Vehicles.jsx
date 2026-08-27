import React, { memo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

import VEHICLES from '../utils/vehicles';
import GlitchedModel from './GlitchedModel';

VEHICLES.forEach((vehicle) => useGLTF.preload(modelFile(vehicle.file)));

function Vehicles({ config }) {
  return VEHICLES.map((vehicle) =>
    config[`vehicle${vehicle.id}Enabled`] ? (
      <GlitchedModel
        key={vehicle.id}
        config={config}
        file={vehicle.file}
        targetLength={vehicle.targetLength}
        glitchActive={config[`vehicle${vehicle.id}Glitch`]}
        position={config[`vehicle${vehicle.id}Position`]}
        rotationY={config[`vehicle${vehicle.id}Rotation`]}
      />
    ) : null
  );
}

export default memo(Vehicles);
