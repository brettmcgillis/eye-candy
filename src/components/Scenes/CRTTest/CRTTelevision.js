/* eslint-disable react/no-array-index-key */

/* eslint-disable no-plusplus */
import React, { createContext, useContext, useMemo } from 'react';

import { Merged, useGLTF } from '@react-three/drei';

const context = createContext();

/* ---------------------------------------------
   MAIN TV
----------------------------------------------*/

export default function CRTTelevision({ ...props }) {
  return (
    <Instances>
      <group {...props}>
        <Model />
      </group>
    </Instances>
  );
}

/* ---------------------------------------------
   INSTANCES
----------------------------------------------*/

export function Instances({ children, ...props }) {
  const { nodes } = useGLTF(`${process.env.PUBLIC_URL}/models/crt_tv.glb`);

  const instances = useMemo(
    () => ({
      DefaultMaterial: nodes.defaultMaterial,
      DefaultMaterial1: nodes.defaultMaterial_1,
      DefaultMaterial2: nodes.defaultMaterial_2,
      DefaultMaterial3: nodes.defaultMaterial_3,
      DefaultMaterial4: nodes.defaultMaterial_4,
      DefaultMaterial5: nodes.defaultMaterial_5,
      DefaultMaterial6: nodes.defaultMaterial_6,
      DefaultMaterial7: nodes.defaultMaterial_7,
      DefaultMaterial8: nodes.defaultMaterial_8,
    }),
    [nodes]
  );

  return (
    <Merged meshes={instances} {...props}>
      {(value) => <context.Provider value={value}>{children}</context.Provider>}
    </Merged>
  );
}

/* ---------------------------------------------
   MODEL
----------------------------------------------*/

export function Model({ ...props }) {
  const instances = useContext(context);
  const { nodes } = useGLTF(`${process.env.PUBLIC_URL}/models/crt_tv.glb`);

  return (
    <group {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group rotation={[-Math.PI / 2, 0, -Math.PI]} scale={0.01}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <group name="tv" position={[0, 26.836, 0]}>
              <group
                name="rear_section"
                position={[0, -0.042, 0]}
                scale={[0.99, 0.99, 1]}
              >
                <instances.DefaultMaterial />
              </group>

              <group name="Front_section">
                <instances.DefaultMaterial1 />
              </group>

              <group name="Front_buttons">
                <instances.DefaultMaterial2 />
              </group>

              {/* ---------------- SCREEN ---------------- */}

              <group name="Screen" position={[0, 0, -166.617]} scale={398.216}>
                <mesh geometry={nodes.defaultMaterial_3.geometry}>
                  <instances.DefaultMaterial3 />
                </mesh>
              </group>

              {/* ---------------------------------------- */}

              <group
                name="Screw"
                position={[3.169, -20.046, -18.301]}
                rotation={[0, 0, -0.596]}
                scale={[0.378, 0.378, 0.221]}
              >
                <instances.DefaultMaterial4 />
              </group>

              <group name="AV_front" position={[0, -26.836, 0]}>
                <instances.DefaultMaterial5 />
              </group>

              <group
                name="AV_back"
                position={[11.057, -26.295, -18.646]}
                rotation={[-Math.PI, 0, -Math.PI]}
              >
                <instances.DefaultMaterial6 />
              </group>

              <group
                name="Coax_connector"
                position={[26.908, -17.616, -17.225]}
                rotation={[-Math.PI / 2, Math.PI / 2, 0]}
                scale={[0.173, 0.159, 0.173]}
              >
                <instances.DefaultMaterial7 />
              </group>

              <group
                name="Logo"
                position={[0.003, -19.835, 0.852]}
                scale={0.11}
              >
                <instances.DefaultMaterial8 />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(`${process.env.PUBLIC_URL}/models/crt_tv.glb`);
