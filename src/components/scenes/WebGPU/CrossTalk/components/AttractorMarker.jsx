import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { Fn, smoothstep, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

const EASING = 0.08;
const MIN_RADIUS = 6;
const RADIUS_PER_STRENGTH = 0.02;
// Behind the feathers' own depth jitter (±30, see FeatherField's Z_JITTER)
// so markers read as a glow the swarm drifts over, never occluding it.
const MARKER_DEPTH = -500;

// A soft glowing dot marking one attractor's live position — a per-window
// attractor (`target`, eased toward the window's current rect center, same
// trick as DesktopCloud) or the shared mouse attractor (`targetRef`, a ref
// mutated every physics frame by useFeatherSwarm — plain `target` would be
// stale here since FeathersView doesn't re-render every frame; see
// GravityBall for the same ref-not-prop reasoning). Exactly one of
// `target`/`targetRef` is expected per instance. Scales to 0 rather than
// unmounting when there's currently no target (e.g. cursor outside every
// window) so the mouse marker doesn't churn mount/unmount every time the
// pointer crosses a window edge.
function AttractorMarker({ color, strength, target, targetRef }) {
  const meshRef = useRef(null);
  const coreRef = useRef(null);

  const { material, uniforms } = useMemo(() => {
    const colorU = uniform(new THREE.Color(color));
    const mat = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    mat.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      const mask = smoothstep(0.5, 0.15, d);
      return vec4(colorU, mask.mul(0.55));
    })();
    return { material: mat, uniforms: { colorU } };
  }, []);

  useEffect(() => {
    uniforms.colorU.value.set(color);
  }, [uniforms, color]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const current = targetRef ? targetRef.current : target;
    if (!current) {
      mesh.scale.setScalar(0);
      return;
    }

    if (!coreRef.current) {
      coreRef.current = { x: current.x, y: current.y };
    } else {
      coreRef.current.x += (current.x - coreRef.current.x) * EASING;
      coreRef.current.y += (current.y - coreRef.current.y) * EASING;
    }

    const radius = MIN_RADIUS + Math.max(strength, 0) * RADIUS_PER_STRENGTH;
    mesh.position.set(coreRef.current.x, coreRef.current.y, MARKER_DEPTH);
    mesh.scale.setScalar(radius * 2);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default memo(AttractorMarker);
