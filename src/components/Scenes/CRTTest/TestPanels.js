/* eslint-disable react/no-array-index-key */
import React, { useMemo } from 'react';

import CRTBlueScreenMaterial from './Materials/CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from './Materials/CRTSceneInSceneMaterial';
import CRTSceneMaterial from './Materials/CRTSceneMaterial';
import CRTShowMaterial from './Materials/CRTShowMaterial';
import CRTSmtpeStaticMaterial from './Materials/CRTSmtpeStaticMaterial';
import CRTStaticMaterial from './Materials/CRTStaticMaterial';
import TestScene from './TestScene';
import useInteractiveTvControls from './useInteractiveTvControls';

export default function TestPanels() {
  const { smtpe, tvStatic, noSignal, terminal, homeVideo, tv, threeD, pip } =
    useInteractiveTvControls();
  /* ---------------------------------------------
     Config 
  ---------------------------------------------- */

  const radius = 7;
  const height = 1;
  const arc = Math.PI * 0.9; // shallow semi arc
  const zOffset = 0.2; // pushes arc forward

  /* ---------------------------------------------
     Material registry
  ---------------------------------------------- */

  const materials = useMemo(
    () => [
      <meshStandardMaterial
        key="std"
        color="#616161"
        roughness={0}
        metalness={1}
      />,
      <CRTStaticMaterial key="static" {...tvStatic} />,
      <CRTSmtpeStaticMaterial key="smtpe" {...smtpe} />,
      <CRTBlueScreenMaterial
        key="terminal"
        // {...TerminalSetting}
        {...terminal}
      />,
      <CRTBlueScreenMaterial
        key="vhs"
        // {...VHSSetting}
        {...noSignal}
      />,
      <CRTShowMaterial key="homeVideo" useWebcam {...homeVideo} />,
      <CRTShowMaterial key="tv" {...tv} />,
      <CRTSceneMaterial key="three-d" scene={<TestScene />} {...threeD} />,
      <CRTSceneInSceneMaterial key="pip" {...pip} />,
    ],
    []
  );

  /* ---------------------------------------------
     Build TRUE circular concave arc
  ---------------------------------------------- */

  const panels = useMemo(() => {
    const count = materials.length;
    if (count === 1) {
      return [
        {
          position: [0, height, 0],
          rotation: [0, 0, 0],
          material: materials[0],
        },
      ];
    }

    return materials.map((mat, i) => {
      const t = i / (count - 1);

      // angle from left → right
      const theta = arc * (t - 0.5);

      // circular arc in XZ
      const x = Math.sin(theta) * radius;
      const z = -(Math.cos(theta) * radius) + radius + zOffset;

      // rotation matches arc
      const rotY = -theta;

      return {
        position: [x, height, z],
        rotation: [0, rotY, 0],
        material: mat,
      };
    });
  }, [materials, radius, height, arc, zOffset]);

  return (
    <>
      {panels.map((panel, i) => (
        <mesh
          key={`panel-${i}`}
          position={panel.position}
          rotation={panel.rotation}
        >
          <planeGeometry args={[2, 2]} />
          {panel.material}
        </mesh>
      ))}
    </>
  );
}
