import React, { memo } from 'react';

import usePick from '../hooks/usePick';
import {
  LOCATION_BLACK_HOLE,
  LOCATION_LUNAR_SURFACE,
  LOCATION_OCEAN,
  LOCATION_TINY_MOON,
  LOCATION_WING,
} from '../utils/locations';
import BlackHoleLocation from './locations/BlackHoleLocation';
import LunarSurfaceLocation from './locations/LunarSurfaceLocation';
import OceanLocation from './locations/OceanLocation';
import TinyMoonLocation from './locations/TinyMoonLocation';
import WingLocation from './locations/WingLocation';
import { BLACK_HOLE_KEYS } from './locations/getBlackHoleControls';
import { LUNAR_KEYS, TINY_MOON_KEYS } from './locations/getMoonControls';
import { OCEAN_KEYS } from './locations/getOceanControls';
import { WING_KEYS } from './locations/getWingControls';

function Location({ anchorRef, config }) {
  const blackHole = usePick(config, BLACK_HOLE_KEYS);
  const ocean = usePick(config, OCEAN_KEYS);
  const wing = usePick(config, WING_KEYS);
  const tinyMoon = usePick(config, TINY_MOON_KEYS);
  const lunar = usePick(config, LUNAR_KEYS);
  const sunAzimuth = config.lightKeyAzimuth;
  const sunElevation = config.lightKeyElevation;

  switch (config.location) {
    case LOCATION_OCEAN:
      return (
        <OceanLocation
          anchorRef={anchorRef}
          config={ocean}
          sunAzimuth={sunAzimuth}
          sunElevation={sunElevation}
        />
      );
    case LOCATION_WING:
      return (
        <WingLocation
          anchorRef={anchorRef}
          backdropColor={config.backdropColor}
          config={wing}
          sunAzimuth={sunAzimuth}
          sunElevation={sunElevation}
        />
      );
    case LOCATION_TINY_MOON:
      return <TinyMoonLocation config={tinyMoon} />;
    case LOCATION_LUNAR_SURFACE:
      return <LunarSurfaceLocation config={lunar} />;
    case LOCATION_BLACK_HOLE:
    default:
      return <BlackHoleLocation config={blackHole} />;
  }
}

export default memo(Location);
