import React, { memo, useEffect, useMemo } from 'react';

import { Fn, smoothstep, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import usePointDrag from '../hooks/usePointDrag';

// A soft glowing dot at this window's light position — doubles as the drag
// handle (own window only, via `draggable`; see usePointDrag). Visual size
// is proportional to the light's own radius/intensity so a window's control
// values are legible from a sibling window too, same idea as
// AttractorMarker's strength->radius mapping.
function LightHandle({ center, color, draggable, onDrag, radius, rect }) {
  const dragHandlers = usePointDrag({ draggable, onDrag, rect });

  const { material, uniforms } = useMemo(() => {
    const colorU = uniform(new THREE.Color(color));
    const mat = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    mat.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      const mask = smoothstep(0.5, 0.1, d);
      return vec4(colorU, mask);
    })();
    return { material: mat, uniforms: { colorU } };
  }, []);

  useEffect(() => {
    uniforms.colorU.value.set(color);
  }, [uniforms, color]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      {...dragHandlers}
      frustumCulled={false}
      material={material}
      position={[center.x, center.y, 2]}
      scale={Math.max(radius * 2.4, 14)}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default memo(LightHandle);
