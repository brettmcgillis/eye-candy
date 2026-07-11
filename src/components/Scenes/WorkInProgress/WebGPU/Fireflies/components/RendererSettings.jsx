import * as THREE from 'three/webgpu';

import { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

const RendererSettings = memo(function RendererSettings({ exposure }) {
  const renderer = useThree((state) => state.gl);

  useEffect(() => {
    const previousToneMapping = renderer.toneMapping;
    const previousExposure = renderer.toneMappingExposure;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = exposure;

    return () => {
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousExposure;
    };
  }, [exposure, renderer]);

  return null;
});

export default RendererSettings;
