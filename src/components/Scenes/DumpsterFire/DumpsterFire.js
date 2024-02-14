import React from 'react';

import Dumpster from 'components/elements/dumpster/Dumpster';
import CameraRig from 'components/rigging/CameraRig';
import LightingRig from 'components/rigging/LightingRig';

export default function DumpsterFire() {
  return (
    <>
      <CameraRig />
      <LightingRig />
      <Dumpster />
    </>
  );
}
