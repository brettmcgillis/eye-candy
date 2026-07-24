import * as THREE from 'three';

import React, { useEffect, useRef } from 'react';

import OldStreetlight from '../../../../../elements/OldStreetlight/OldStreetlight';

// Thin scene wrapper around the shared OldStreetlight element that applies the
// scene-specific styling: an emissive sodium-lit GLASS material and an optional
// hidden BASE. We clone the GLASS material once so we don't mutate the cached one.
export default function Streetlight({
  glassColor = '#ffb347',
  glassEmissive = 6,
  showBase = true,
  ...props
}) {
  const ref = useRef();

  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    group.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      if (o.material.name === 'GLASS') {
        if (!o.userData.glassCloned) {
          o.material = o.material.clone();
          o.userData.glassCloned = true;
        }
        o.material.color = new THREE.Color(glassColor);
        o.material.emissive = new THREE.Color(glassColor);
        o.material.emissiveIntensity = glassEmissive;
        o.material.toneMapped = false;
        o.material.needsUpdate = true;
      }
      if (o.material.name === 'BASE') {
        o.visible = showBase;
      }
    });
  }, [glassColor, glassEmissive, showBase]);

  return (
    <group ref={ref} {...props}>
      <OldStreetlight />
    </group>
  );
}
