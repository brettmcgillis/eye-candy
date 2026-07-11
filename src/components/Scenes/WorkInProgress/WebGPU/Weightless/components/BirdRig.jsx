import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import HummingBird from '../../../../../elements/HummingBird/HummingBird';

const CLIP_NAME = 'Take 001';

// Mounts the animated hummingbird and hands its skinned meshes up to the
// particle/trail systems. The rig keeps animating (mixer + bone matrices)
// even when hidden — everything is driven from the skeleton, not the
// pixels. `ghost` swaps materials for the dim dark body the three-sketches
// references render beneath their trails (polygon offset so trails on the
// surface don't z-fight).
function BirdRig({ visible, ghost, ghostOpacity, timeScale, onReady }) {
  const groupRef = useRef(null);

  const ghostMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x141418,
        transparent: true,
        opacity: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: 3,
        polygonOffsetUnits: 3,
      }),
    []
  );

  useEffect(() => {
    ghostMaterial.opacity = ghostOpacity;
  }, [ghostMaterial, ghostOpacity]);

  useEffect(() => () => ghostMaterial.dispose(), [ghostMaterial]);

  useEffect(() => {
    const meshes = [];
    groupRef.current?.traverse((object) => {
      if (object.isSkinnedMesh) meshes.push(object);
    });
    if (meshes.length) onReady(meshes);
  }, [onReady]);

  useEffect(() => {
    if (!ghost) return undefined;
    const restore = [];
    groupRef.current?.traverse((object) => {
      if (object.isSkinnedMesh) {
        restore.push([object, object.material]);
        object.material = ghostMaterial; // eslint-disable-line no-param-reassign
      }
    });
    return () => {
      restore.forEach(([object, material]) => {
        object.material = material;
      });
    };
  }, [ghost, ghostMaterial]);

  return (
    <group ref={groupRef} visible={visible || ghost}>
      <HummingBird clip={CLIP_NAME} timeScale={timeScale} />
    </group>
  );
}

export default memo(BirdRig);
