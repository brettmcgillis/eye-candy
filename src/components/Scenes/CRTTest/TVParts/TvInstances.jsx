/* eslint-disable react/jsx-no-constructed-context-values */
// TvInstances.js
import * as THREE from 'three';

import React, { createContext, useMemo } from 'react';

import { Merged, useGLTF } from '@react-three/drei';

export const TvContext = createContext(null);

export function TvInstances({
  children,
  bodyMaterial,
  dialMaterial,
  knobMaterial,
}) {
  const { nodes } = useGLTF(`/models/retro_tv.glb`);

  const baseMaterials = useMemo(
    () => ({
      body:
        bodyMaterial ??
        new THREE.MeshStandardMaterial({
          color: '#050505',
          roughness: 0.65,
          metalness: 0.15,
        }),

      dial:
        dialMaterial ??
        new THREE.MeshStandardMaterial({
          color: '#0b0b0b',
          roughness: 0.4,
          metalness: 0.1,
        }),

      knob:
        knobMaterial ??
        new THREE.MeshStandardMaterial({
          color: '#0b0b0b',
          roughness: 0.4,
          metalness: 0.1,
        }),
    }),
    [bodyMaterial, dialMaterial, knobMaterial]
  );

  const instances = useMemo(() => {
    const body = nodes.retro_tv.clone();
    const knob0 = nodes.knob_01.clone();
    const knob1 = nodes.knob_02.clone();

    body.material = baseMaterials.body;
    knob0.material = baseMaterials.knob;
    knob1.material = baseMaterials.knob;

    return { Body: body, Knob: knob0, Knob1: knob1 };
  }, [nodes, baseMaterials]);

  return (
    <Merged meshes={instances}>
      {(merged) => (
        <TvContext.Provider
          value={{ merged, nodes, screenGeo: nodes.screen.geometry }}
        >
          {children}
        </TvContext.Provider>
      )}
    </Merged>
  );
}

useGLTF.preload(`/models/retro_tv.glb`);
