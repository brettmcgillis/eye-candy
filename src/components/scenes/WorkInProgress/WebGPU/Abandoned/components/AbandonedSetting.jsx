import React from 'react';

import AbandonedHouseInterior from '../../../../../elements/AbandonedHouseInterior/AbandonedHouseInterior';

export default function AbandonedSetting({ ...props }) {
  return (
    <group {...props}>
      <AbandonedHouseInterior position={[0, 12, 0]} scale={[1, -1, 1]} />
      <AbandonedHouseInterior position={[0, 0, 0]} />
    </group>
  );
}
