import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { createStudio } from '@modules/fractalAutomataRender';

function StudioEnvironment({ enabled, intensity }) {
  const { gl, scene } = useThree();
  const studio = useMemo(() => createStudio(), []);

  useEffect(() => {
    if (!enabled) return undefined;
    studio.update(gl);
    scene.environment = studio.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
    };
  }, [enabled, gl, intensity, scene, studio]);

  useEffect(() => () => studio.dispose(), [studio]);

  return null;
}

export default memo(StudioEnvironment);
