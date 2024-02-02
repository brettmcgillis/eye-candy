import { folder, useControls } from 'leva';
import React from 'react';

function LightingRig() {
  const {
    plPosition,
    plDecay,
    plDistance,
    plIntensity,
    plCastShadow,
    ambientLightIntensity,
  } = useControls(
    'Lighting Rig',
    {
      'Point Light': folder(
        {
          plPosition: {
            label: 'Position',
            value: { x: 3, y: 3, z: 5 },
          },
          plDecay: {
            label: 'Decay',
            value: 0,
            min: -10,
            max: 10,
            step: 0.1,
          },
          plDistance: {
            label: 'Distance',
            value: -1,
            min: -10,
            max: 10,
            step: 0.1,
          },
          plIntensity: {
            label: 'Intensity',
            value: 0.8,
            min: 0,
            max: 10,
            step: 0.1,
          },
          plCastShadow: { label: 'Cast Shadow', value: true },
        },
        { collapsed: true }
      ),
      'Ambient Light': folder(
        {
          ambientLightIntensity: {
            label: 'Intensity',
            value: 0,
            min: 0,
            max: 1,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  return (
    <group>
      <ambientLight intensity={ambientLightIntensity} />
      <pointLight
        position={[plPosition.x, plPosition.y, plPosition.z]}
        decay={plDecay}
        distance={plDistance}
        intensity={plIntensity}
        castShadow={plCastShadow}
      />
    </group>
  );
}

export default LightingRig;
