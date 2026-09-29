import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { createFog } from '@modules/nestingBoxesRender';

function FogRig({ config }) {
  const scene = useThree((state) => state.scene);
  const fog = useMemo(createFog, []);

  const { fogColor, fogFar, fogNear } = config;
  useEffect(() => {
    fog.apply({ fogColor, fogFar, fogNear });
  }, [fog, fogColor, fogFar, fogNear]);

  useEffect(() => {
    if (!config.fogEnabled) return undefined;

    const previous = scene.fogNode;
    scene.fogNode = fog.node;

    return () => {
      scene.fogNode = previous;
    };
  }, [config.fogEnabled, fog, scene]);

  return null;
}

export default memo(FogRig);
