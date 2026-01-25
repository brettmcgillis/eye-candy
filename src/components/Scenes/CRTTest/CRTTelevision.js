/* eslint-disable react/jsx-no-constructed-context-values */

/* eslint-disable no-unused-vars */
import React, { createContext, forwardRef, useContext, useMemo } from 'react';
import * as THREE from 'three';

import { animated } from '@react-spring/three';
import { Merged, useGLTF } from '@react-three/drei';

const TvContext = createContext(null);

/* ---------------------------------------------
   Public API (DUMB VIEW)
---------------------------------------------- */

const CRTTelevision = forwardRef(function CRTTelevision(
  {
    materials,
    screenMaterial,

    knob0Rotation = 0,
    knob1Rotation = 0,

    dials = {
      dial0: { depth: 0, color: '#000000', intensity: 0 },
      dial1: { depth: 0, color: '#000000', intensity: 0 },
      dial2: { depth: 0, color: '#000000', intensity: 0 },
    },

    onKnobClick,
    onDialClick,
    ...props
  },
  ref
) {
  return (
    <TvInstances materials={materials}>
      <group {...props}>
        <TvModel
          screenMaterial={screenMaterial}
          knob0Rotation={knob0Rotation}
          knob1Rotation={knob1Rotation}
          dials={dials}
          onKnobClick={onKnobClick}
          onDialClick={onDialClick}
        />
      </group>
    </TvInstances>
  );
});

/* ---------------------------------------------
   Instancing Layer
---------------------------------------------- */

function TvInstances({ children, materials }) {
  const { nodes } = useGLTF(`${process.env.PUBLIC_URL}/models/retro_tv.glb`);

  const baseMaterials = useMemo(
    () => ({
      body:
        materials?.body ??
        new THREE.MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 }),

      knob:
        materials?.knob ??
        new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.25 }),

      screenOff:
        materials?.screen ??
        new THREE.MeshStandardMaterial({
          color: '#616161',
          roughness: 0,
          metalness: 1,
        }),
    }),
    [materials]
  );

  const instances = useMemo(() => {
    const body = nodes.retro_tv.clone();
    const knob = nodes.knob_01.clone();
    const knob1 = nodes.knob_02.clone();

    body.material = baseMaterials.body;
    knob.material = baseMaterials.knob;
    knob1.material = baseMaterials.knob;

    return { Retrotv: body, Knob: knob, Knob1: knob1 };
  }, [nodes, baseMaterials]);

  return (
    <Merged meshes={instances}>
      {(value) => {
        const ctx = { instances: value, baseMaterials, nodes };
        return <TvContext.Provider value={ctx}>{children}</TvContext.Provider>;
      }}
    </Merged>
  );
}

/* ---------------------------------------------
   Model (NO STATE, NO SPRINGS)
---------------------------------------------- */

function TvModel({
  screenMaterial,
  knob0Rotation,
  knob1Rotation,
  dials,
  onKnobClick,
  onDialClick,
}) {
  const { instances, baseMaterials, nodes } = useContext(TvContext);

  /* ---------- Persistent dial materials ---------- */

  return (
    <group dispose={null}>
      <instances.Retrotv rotation={[-Math.PI, -Math.PI, -Math.PI]}>
        {/* -------- Dials -------- */}

        {['dial0', 'dial1', 'dial2'].map((id, i) => {
          const node = nodes[`dial_0${i + 1}`];
          const dial = dials[id];

          return (
            <animated.mesh
              key={id}
              geometry={node.geometry}
              position-x={[0.254, 0.291, 0.328][i]}
              position-y={0.208}
              position-z={dial.depth.to((z) => 0.092 + z)}
              onPointerDown={(e) => {
                e.stopPropagation();
                onDialClick?.(id);
              }}
              castShadow
              receiveShadow
            >
              {/* ✅ SINGLE OWNER MATERIAL (like Reversal) */}
              <animated.meshStandardMaterial
                attach="material"
                color="#050505"
                emissive={dial.color}
                emissiveIntensity={dial.intensity}
                toneMapped={false}
                roughness={0.3}
                metalness={0.0}
              />
            </animated.mesh>
          );
        })}

        {/* -------- Knobs -------- */}

        <animated.group
          position={[0.291, 0.406, 0.097]}
          rotation-z={knob0Rotation.to((v) => -v)}
          onClick={(e) => {
            e.stopPropagation();
            onKnobClick?.('knob0');
          }}
        >
          <instances.Knob />
        </animated.group>

        <animated.group
          position={[0.291, 0.289, 0.097]}
          rotation-z={knob1Rotation.to((v) => -v)}
          onClick={(e) => {
            e.stopPropagation();
            onKnobClick?.('knob1');
          }}
        >
          <instances.Knob1 />
        </animated.group>

        {/* -------- Screen -------- */}

        <mesh
          geometry={nodes.screen.geometry}
          position={[-0.077, 0.262, 0.07]}
          rotation={[0, 0, -3.13]}
        >
          {screenMaterial ? (
            React.cloneElement(screenMaterial, { attach: 'material' })
          ) : (
            <primitive attach="material" object={baseMaterials.screenOff} />
          )}
        </mesh>
      </instances.Retrotv>
    </group>
  );
}

useGLTF.preload(`${process.env.PUBLIC_URL}/models/retro_tv.glb`);

export default CRTTelevision;
