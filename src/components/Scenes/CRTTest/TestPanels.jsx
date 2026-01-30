/* eslint-disable react/no-array-index-key */
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { a, useTransition } from '@react-spring/three';

import Reversal, {
  InteractiveReversal,
} from '../../elements/reversal/Reversal';
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
  const arc = Math.PI * 0.9;
  const zOffset = 0.2;

  /* ---------------------------------------------
     Material registry (STATIC)
  ---------------------------------------------- */

  const materialRegistry = useMemo(
    () => [
      <meshStandardMaterial
        key="std"
        color="#111"
        roughness={0}
        metalness={1}
      />,
      <CRTStaticMaterial key="static" {...tvStatic} />,
      <CRTSmtpeStaticMaterial key="smtpe" {...smtpe} />,
      <CRTBlueScreenMaterial key="terminal" {...terminal} />,
      <CRTBlueScreenMaterial key="vhs" {...noSignal} />,
      <CRTShowMaterial key="homeVideo" useWebcam {...homeVideo} />,
      <CRTShowMaterial key="tv" {...tv} />,
      <CRTSceneMaterial key="three-d" scene={<TestScene />} {...threeD} />,
      <CRTSceneInSceneMaterial key="pip" {...pip} />,
    ],
    []
  );

  /* ---------------------------------------------
     Live panel collection (DYNAMIC)
  ---------------------------------------------- */

  const [activeCount, setActiveCount] = useState(0);
  const directionRef = useRef(1); // 1 = building, -1 = tearing down

  const activeMaterials = useMemo(
    () => materialRegistry.slice(0, activeCount),
    [materialRegistry, activeCount]
  );

  /* ---------------------------------------------
     Arc layout (CENTER-PACKED)
  ---------------------------------------------- */

  const panels = useMemo(() => {
    const count = activeMaterials.length;
    if (count === 0) return [];

    const maxArc = arc;
    const maxPanels = materialRegistry.length;
    const baseSpacing = maxArc / Math.max(maxPanels - 1, 1);
    const spacing = baseSpacing * 0.95;
    const mid = (count - 1) / 2;

    return activeMaterials.map((mat, i) => {
      const theta = (i - mid) * spacing;

      const x = Math.sin(theta) * radius;
      const z = -(Math.cos(theta) * radius) + radius + zOffset;

      return {
        position: [x, height, z],
        rotation: [0, -theta, 0],
        material: mat,
      };
    });
  }, [activeMaterials, radius, height, arc, zOffset, materialRegistry.length]);

  /* ---------------------------------------------
     Transitions (ENTER + UPDATE + LEAVE)
  ---------------------------------------------- */

  const transitions = useTransition(panels, {
    keys: (_, i) => i,

    from: {
      position: [0, -1, 3],
      rotation: [0, 0, 0],
      scale: 0.25,
    },

    enter: (item) => ({
      position: item.position,
      rotation: item.rotation,
      scale: 1,
    }),

    update: (item) => ({
      position: item.position,
      rotation: item.rotation,
      scale: 1,
    }),

    leave: {
      position: [0, height - 0.5, 2.5],
      rotation: [0, Math.PI * 0.15, 0],
      scale: 0.05,
    },

    config: {
      mass: 1,
      tension: 220,
      friction: 26,
    },
  });

  /* ---------------------------------------------
     Interaction
  ---------------------------------------------- */

  const handleReversalClick = useCallback(() => {
    setActiveCount((prev) => {
      if (prev >= materialRegistry.length) {
        directionRef.current = -1;
        return prev - 1;
      }

      if (prev <= 0) {
        directionRef.current = 1;
        return 1;
      }

      return prev + directionRef.current;
    });
  }, [materialRegistry.length]);

  /* ---------------------------------------------
     Render
  ---------------------------------------------- */

  return (
    <>
      {transitions((style, panel, _, i) => (
        <a.mesh
          key={`panel-${i}`}
          position={style.position}
          rotation={style.rotation}
          scale={style.scale}
        >
          <planeGeometry args={[2, 2]} />
          {panel.material}
        </a.mesh>
      ))}
      <InteractiveReversal
        position={[0, 0, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleReversalClick}
      />

      <Reversal position={[-1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />
      <Reversal position={[1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />
    </>
  );
}
