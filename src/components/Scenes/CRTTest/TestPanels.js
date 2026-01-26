/* eslint-disable react/no-array-index-key */
import React, { useMemo } from 'react';

import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from './CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from './CRTSceneInSceneMaterial';
import CRTSceneMaterial from './CRTSceneMaterial';
import CRTShowMaterial from './CRTShowMaterial';
import CRTSnowMaterial from './CRTSnowMaterial';
import CRTStaticMaterial from './CRTStaticMaterial';
import TestScene from './TestScene';

export default function TestPanels() {
  /* ---------------------------------------------
     Config 
  ---------------------------------------------- */

  const radius = 7;
  const height = 1;
  const arc = Math.PI * 0.6; // shallow semi arc
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
      <CRTSnowMaterial key="snow" />,
      <CRTStaticMaterial key="static" />,
      <CRTBlueScreenMaterial key="terminal" {...TerminalSetting} />,
      <CRTBlueScreenMaterial key="vhs" {...VHSSetting} />,
      <CRTShowMaterial key="homeVideo" useWebcam />,
      <CRTShowMaterial key="tv" />,
      <CRTSceneMaterial key="triple-d" scene={<TestScene />} />,
      <CRTSceneInSceneMaterial key="pip" />,
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
