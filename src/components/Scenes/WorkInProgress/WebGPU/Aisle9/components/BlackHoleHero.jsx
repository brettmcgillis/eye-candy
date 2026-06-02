import React, { memo } from 'react';

import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
} from '../presets/presets';
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
    default:
      return <WebGPUBlackHole config={config} />;
  }
});

export default BlackHoleHero;
