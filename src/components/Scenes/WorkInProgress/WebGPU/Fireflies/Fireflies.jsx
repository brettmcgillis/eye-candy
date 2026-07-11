import React, { memo, useMemo } from 'react';

import { useWindowSync } from '../../../../../modules/windowSync';
import CameraRig from '../../../../rigging/CameraRig';
import FloidsSwarm from './components/FloidsSwarm';
import RendererSettings from './components/RendererSettings';
import useSceneControls, {
  WINDOW_SYNC_CHANNEL,
} from './hooks/useSceneControls';
import useSharedSwarm from './hooks/useSharedSwarm';

// World units per real screen pixel: converts the gap between two windows'
// OS screen rects into the world-space offset applied to this window's
// content group. First-pass value, not analytically derived — see todo.md.
const WORLD_UNITS_PER_PIXEL = 0.015;

function Fireflies() {
  const config = useSceneControls();
  const { isHost, selfRect, windows } = useWindowSync(WINDOW_SYNC_CHANNEL);
  const swarm = useSharedSwarm({ config, isHost, windows });

  // Every alive window is a fixed-size peephole onto the SAME shared
  // flock/habitat (see hooks/useSharedSwarm.js — habitat grows with
  // windows.length, one host-authoritative simulation broadcasts to every
  // window). The content group is translated by this window's real screen
  // offset from the host (the lowest-id alive window, windows[0]) so a
  // second tab reveals a different slice of that now-bigger habitat instead
  // of just mirroring the same view twice. The camera itself never moves.
  const worldOffset = useMemo(() => {
    if (!selfRect || windows.length <= 1) return [0, 0, 0];
    const host = windows[0];
    return [
      -(selfRect.x - host.x) * WORLD_UNITS_PER_PIXEL,
      0,
      -(selfRect.y - host.y) * WORLD_UNITS_PER_PIXEL,
    ];
  }, [selfRect, windows]);

  return (
    <>
      <color attach="background" args={[config.backgroundColor]} />
      <RendererSettings exposure={config.toneMappingExposure} />
      <CameraRig
        camera={config.camera}
        orbitInteractionEnabled={windows.length <= 1}
      />
      <group position={worldOffset}>
        <mesh rotation-x={-Math.PI / 2} position-y={0}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial
            color="#030713"
            metalness={0.1}
            roughness={0.96}
          />
        </mesh>
        <FloidsSwarm config={config} {...swarm} />
      </group>
    </>
  );
}

export default memo(Fireflies);
