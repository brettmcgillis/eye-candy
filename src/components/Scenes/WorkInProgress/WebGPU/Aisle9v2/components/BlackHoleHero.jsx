import React, { memo } from 'react';

import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_MOCK,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
} from '../presets/presets';
import BlackHoleV2 from './BlackHoleV2';
import LegacyBlackHole from './variants/LegacyBlackHole';
import SingularityBlackHole from './variants/SingularityBlackHole';
import WebGPUBlackHole from './variants/WebGPUBlackHole';

const BlackHoleHero = memo(function BlackHoleHero({ config }) {
  switch (config.blackHoleVariant) {
    case BLACK_HOLE_VARIANT_LEGACY_PORT:
      return <LegacyBlackHole config={config} />;
    case BLACK_HOLE_VARIANT_SINGULARITY:
      return <SingularityBlackHole config={config} />;
    case BLACK_HOLE_VARIANT_WEBGPU:
      return <WebGPUBlackHole config={config} />;
    case BLACK_HOLE_VARIANT_MOCK:
    default:
      return <BlackHoleV2 config={config} />;
  }
});

export default BlackHoleHero;
