import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js';

import { directionFromAngles } from '../../utils/sceneUtils';

const SKY_SCALE = 9000;

function PlaneSky({ mie, rayleigh, sunAzimuth, sunElevation, turbidity }) {
  const sky = useMemo(() => {
    const mesh = new SkyMesh();
    mesh.scale.setScalar(SKY_SCALE);
    mesh.frustumCulled = false;
    mesh.material.depthWrite = false;
    mesh.cloudCoverage.value = 0;
    return mesh;
  }, []);

  useEffect(() => {
    sky.turbidity.value = turbidity;
    sky.rayleigh.value = rayleigh;
    sky.mieCoefficient.value = mie;
    sky.mieDirectionalG.value = 0.8;
    sky.sunPosition.value.copy(directionFromAngles(sunAzimuth, sunElevation));
  }, [mie, rayleigh, sky, sunAzimuth, sunElevation, turbidity]);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [sky]
  );

  useFrame(({ camera }) => {
    sky.position.copy(camera.position);
  });

  return <primitive object={sky} renderOrder={-10} />;
}

export default memo(PlaneSky);
