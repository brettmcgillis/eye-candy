import React from 'react';

import CameraRig from '../../../../rigging/CameraRig';
import FloatingSeeds from './components/FloatingSeeds';
import Grass from './components/Grass';
import SkyRig from './components/SkyRig';
import Terrain from './components/Terrain';
import Water from './components/Water';
import useCloudShade from './hooks/useCloudShade';
import useHeightField from './hooks/useHeightField';
import useSceneControls from './hooks/useSceneControls';

// Rolling grassy terrain with the scene text CSG-carved out of it: sediment
// strata visible on the cut walls, a common water table flooding the letters,
// wind in the grass, and light clouds rolling through a sunny afternoon.

// Keep the near-ortho composition: no pan, gentle polar/azimuth window.
const ORBIT_CONTROLS_PROPS = {
  enablePan: false,
  maxAzimuthAngle: 0.9,
  maxDistance: 160,
  maxPolarAngle: 1.25,
  minAzimuthAngle: -0.9,
  minDistance: 30,
  minPolarAngle: 0.25,
};

export default function FromTheDirt() {
  const config = useSceneControls();
  const heightField = useHeightField(config);
  const cloudShade = useCloudShade(config);

  return (
    <>
      <CameraRig
        camera={config.camera}
        orbitControlsProps={ORBIT_CONTROLS_PROPS}
      />
      <SkyRig config={config} />
      <Terrain
        cloudShade={cloudShade}
        config={config}
        heightField={heightField}
      />
      <Grass
        cloudShade={cloudShade}
        config={config}
        heightField={heightField}
      />
      <Water
        cloudShade={cloudShade}
        config={config}
        heightField={heightField}
      />
      <FloatingSeeds
        cloudShade={cloudShade}
        config={config}
        heightField={heightField}
      />
    </>
  );
}
