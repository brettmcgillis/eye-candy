import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import OldStreetlight from '@elements/OldStreetlight/OldStreetlight';
import { modelFile } from '@utils/appUtils';

import PaintableShell from './PaintableShell';

// Measured from old_streetlight.glb: the model is only 1.51 units tall with
// the lamp glass centered around [0.01, 1.34, 0] — so "taller, shining
// across the wall" (todo item 53) comes from the scale prop, and the
// spotlight is anchored at the measured lamp-head position (scaled) rather
// than a guessed height.
const LAMP_HEAD_LOCAL = [0.01, 1.34, 0];

// Thin wrapper around the shared OldStreetlight element applying the
// night-mode sodium glass tint, a real SpotLight thrown from the lamp head
// (aimed via `spotTarget`, typically the wall face), and a PaintableShell
// over the pole so the streetlight itself takes spray paint (todo item 47).
function Streetlight({
  glassColor = '#ffb347',
  glassEmissive = 0,
  scale = 3,
  spotColor = '#ffb347',
  spotIntensity = 0,
  spotTarget = [0, 1.5, 0],
  ...props
}) {
  const ref = useRef();
  const spotRef = useRef();
  const { nodes } = useGLTF(modelFile('old_streetlight.glb'));

  const targetObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    // Cloning + mutating the traversed mesh's material in place is the
    // standard three.js pattern for a one-off material override.
    /* eslint-disable no-param-reassign */
    group.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.name !== 'GLASS') return;
      if (!o.userData.glassCloned) {
        o.material = o.material.clone();
        o.userData.glassCloned = true;
      }
      o.material.color = new THREE.Color(glassColor);
      o.material.emissive = new THREE.Color(glassColor);
      o.material.emissiveIntensity = glassEmissive;
      o.material.toneMapped = false;
      o.material.needsUpdate = true;
    });
    /* eslint-enable no-param-reassign */
  }, [glassColor, glassEmissive]);

  useEffect(() => {
    targetObject.position.set(...spotTarget);
    targetObject.updateMatrixWorld();
  }, [spotTarget, targetObject]);

  return (
    <group ref={ref} {...props}>
      <group scale={scale}>
        <OldStreetlight />
        {/* Same parent + no extra transform = shell tracks the pole mesh
            exactly (see PaintableShell.jsx). Glass and base excluded — the
            glass is emissive and the base is a zero-height disc. */}
        <PaintableShell geometry={nodes.Streetlight_TEXTURE_0.geometry} />
      </group>
      {/* Spot + target live in the UNSCALED group so `spotTarget` stays in
          plain meters relative to the streetlight's base — only the lamp
          anchor point is multiplied by the visual scale. */}
      {spotIntensity > 0 && (
        <>
          <spotLight
            ref={spotRef}
            position={LAMP_HEAD_LOCAL.map((v) => v * scale)}
            target={targetObject}
            color={spotColor}
            intensity={spotIntensity}
            angle={0.65}
            penumbra={0.6}
            decay={1.2}
            castShadow
          />
          <primitive object={targetObject} />
        </>
      )}
    </group>
  );
}

export default memo(Streetlight);

useGLTF.preload(modelFile('old_streetlight.glb'));
