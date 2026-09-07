import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { Flare as FlareBody, hash01 } from '@modules/houseOfLeaves';

// The scene's flare: the module's body and light, plus the registration that
// puts it into the volumetric. Its world position is read from the object
// rather than the props, because the group it sits in is moved by the walker's
// rebase every frame and the march needs where it actually is.
function Flare({ config, flares, position, seed = 0 }) {
  const groupRef = useRef(null);

  const entry = useMemo(
    () => ({ position: new THREE.Vector3(), intensity: 0 }),
    []
  );
  useEffect(() => flares.add(entry), [entry, flares]);

  // Each flare burns at its own rate and its own phase, so a corridor of them
  // never pulses in unison.
  const rate = useMemo(() => 0.6 + hash01(seed * 5.9 + 2.3) * 1.6, [seed]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime * rate + seed;
    const flicker =
      1 -
      config.flareFlicker * 0.5 * (1 + Math.sin(t * 17) * Math.sin(t * 6.3));
    group.getWorldPosition(entry.position);
    entry.position.y += config.flareHeight;
    entry.intensity = config.flareIntensity * Math.max(0, flicker);
  });

  return (
    <group position={position} ref={groupRef}>
      <FlareBody
        color={config.flareColor}
        flicker={config.flareFlicker}
        glow={config.flareGlow}
        intensity={config.flareIntensity}
        length={config.flareLength}
        radius={config.flareRadius}
        range={config.flareRange}
        seed={seed}
        shadows={config.flareShadows}
        shadowMapSize={512}
      />
    </group>
  );
}

export default memo(Flare);
