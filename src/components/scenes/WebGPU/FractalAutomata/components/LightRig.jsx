import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { createLightRig } from '@modules/fractalAutomataRender';

// `exposure` mutates the shared renderer's toneMappingExposure directly and
// is restored on unmount so it doesn't leak into other scenes.
function LightRig({ config }) {
  const { gl } = useThree();
  const exposureSnapshotRef = useRef(null);
  const rig = useMemo(() => createLightRig(), []);

  useEffect(() => {
    rig.apply(config);
  }, [
    rig,
    config.level,
    config.cellSpacing,
    config.detailEnhanceEnabled,
    config.lightAzimuth,
    config.lightElevation,
    config.keyLightIntensity,
    config.ambientIntensity,
    config.rimLightIntensity,
    config.bounceLightIntensity,
    config.shadowIntensity,
    config.shadowSoftness,
  ]);

  useEffect(() => {
    if (exposureSnapshotRef.current === null) {
      exposureSnapshotRef.current = gl.toneMappingExposure;
    }
    gl.toneMappingExposure = config.exposure;
  }, [gl, config.exposure]);

  useEffect(
    () => () => {
      if (exposureSnapshotRef.current !== null) {
        gl.toneMappingExposure = exposureSnapshotRef.current;
      }
    },
    [gl]
  );

  return <primitive object={rig.group} />;
}

export default memo(LightRig);
