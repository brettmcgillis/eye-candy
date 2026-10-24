import React, { Suspense, useEffect, useMemo } from 'react';

import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import { controlsFor } from '@modules/cumulus';

import CumulusSubject from './CumulusSubject';

function Ready({ onReady }) {
  const get = useThree((state) => state.get);
  useEffect(() => {
    onReady?.(get());
  }, [get, onReady]);
  return null;
}
export default function CumulusStage({
  config,
  onReady,
  subjectRef,
  transparent = false,
}) {
  const c = useMemo(() => controlsFor(config), [config]);
  return (
    <>
      {!transparent && <color attach="background" args={[c.backgroundColor]} />}
      <ambientLight intensity={c.ambientIntensity} />
      <pointLight
        position={[c.plPosition.x, c.plPosition.y, c.plPosition.z]}
        decay={c.plDecay}
        distance={c.plDistance}
        intensity={c.plIntensity}
        castShadow={c.plCastShadow}
      />
      {c.spotlightEnabled && (
        <spotLight
          position={[
            c.spotlightPosition.x,
            c.spotlightPosition.y,
            c.spotlightPosition.z,
          ]}
          angle={c.spotlightAngle}
          penumbra={c.spotlightPenumbra}
          intensity={c.spotlightIntensity}
          color={c.spotlightColor}
          castShadow={c.spotlightCastShadow}
        />
      )}
      <Suspense fallback={null}>
        <group ref={subjectRef}>
          <CumulusSubject controls={c} />
        </group>
        {c.environmentIntensity > 0 && (
          <Environment
            preset="studio"
            environmentIntensity={c.environmentIntensity}
          />
        )}
        <Ready onReady={onReady} />
      </Suspense>
      {c.bloomEnabled && (
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            intensity={c.bloomIntensity}
            luminanceThreshold={c.bloomLuminanceThreshold}
            luminanceSmoothing={c.bloomLuminanceSmoothing}
            mipmapBlur
            radius={c.bloomRadius}
          />
        </EffectComposer>
      )}
    </>
  );
}
