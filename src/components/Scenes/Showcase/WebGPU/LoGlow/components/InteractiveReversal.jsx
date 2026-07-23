import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import {
  createGrowthMaterial,
  updateGrowthMaterial,
} from '../growth/growthMaterial';
import useBackdropPixelate from '../hooks/useBackdropPixelate';
import useDifferentialGrowth from '../hooks/useDifferentialGrowth';
import neonFlicker from '../utils/neonFlicker';

/* -------------------------------------------------------
   LoGlow-specific interactive Reversal with neon flicker and
   differential-growth inner mesh (see hooks/useDifferentialGrowth).
------------------------------------------------------- */

const INNER_SCALE = [10, 1.018, 10];

export default function InteractiveReversal({
  pressDepth = 0.015,
  emissiveIntensity = 2.5,
  enableNeonFlicker = true,
  neonFlickerIntensity = 2,
  neonFlickerFrequency = 10,
  innerColor = '#ff0000',
  outerColor = '#000000',
  growthEnabled = false,
  growthSim,
  growthDriver,
  growthShading,
  phaseOffset = 0,
  onClick,
  pixelateBackdrop = false,
  pixelateCellSize = 12,
  pixelateLevels = 3,
  pixelateThreshold = 0.55,
  pixelateNoiseScale = 1.5,
  pixelateJitterAmount = 0.12,
  pixelateOutlineWidth = 0.08,
  pixelateOutlineStrength = 0.5,
  ...props
}) {
  const { nodes } = useGLTF(modelFile('Reversal.glb'));
  const [isOn, setIsOn] = useState(true);
  const [isPressed, setIsPressed] = useState(false);

  const originalRef = useRef(null);
  const growthGroupRef = useRef(null);

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: innerColor,
        emissive: innerColor,
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      }),
    [innerColor]
  );

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: outerColor,
        side: THREE.DoubleSide,
      }),
    [outerColor]
  );

  useBackdropPixelate(outerMaterial, {
    enabled: pixelateBackdrop,
    cellSize: pixelateCellSize,
    levels: pixelateLevels,
    threshold: pixelateThreshold,
    noiseScale: pixelateNoiseScale,
    jitterAmount: pixelateJitterAmount,
    outlineWidth: pixelateOutlineWidth,
    outlineStrength: pixelateOutlineStrength,
  });

  const gradientMaterial = useMemo(
    () => createGrowthMaterial(growthShading),
    []
  );
  useEffect(() => () => gradientMaterial.dispose(), [gradientMaterial]);

  const activeInnerMaterial =
    growthShading.mode === 'neon' ? innerMaterial : gradientMaterial;

  const { mesh, restoreRef, engagedRef } = useDifferentialGrowth({
    sourceGeometry: nodes['reversal-in'].geometry,
    material: activeInnerMaterial,
    enabled: growthEnabled,
    sim: growthSim,
    driver: { ...growthDriver, phase: growthDriver.phase + phaseOffset },
  });

  const { pressY } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    config: { mass: 0.6, tension: 300, friction: 14 },
  });

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    let intensity = 0;
    if (isOn && enableNeonFlicker) {
      intensity = neonFlicker(
        elapsed,
        emissiveIntensity,
        neonFlickerIntensity,
        neonFlickerFrequency
      );
    } else if (isOn) {
      intensity = emissiveIntensity;
    }
    innerMaterial.emissiveIntensity = intensity;

    if (growthShading.mode !== 'neon') {
      updateGrowthMaterial(gradientMaterial, growthShading);
    }

    const engaged = growthEnabled && engagedRef.current;
    if (originalRef.current) {
      originalRef.current.visible = !engaged;
    }
    const growthGroup = growthGroupRef.current;
    if (growthGroup) {
      growthGroup.visible = engaged;
      const restore = restoreRef.current;
      if (restore) {
        mesh.position.copy(restore.position);
        mesh.scale.setScalar(restore.scale);
      }
    }
  });

  const pointerHandlers = {
    onPointerDown: (e) => {
      e.stopPropagation();
      onClick?.();
      setIsPressed(true);
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      setIsPressed(false);
      setIsOn((v) => !v);
    },
    onPointerLeave: () => setIsPressed(false),
  };

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <animated.group position-y={pressY} {...pointerHandlers}>
          <mesh
            ref={originalRef}
            castShadow
            receiveShadow
            geometry={nodes['reversal-in'].geometry}
            material={innerMaterial}
            scale={INNER_SCALE}
          />
          <group ref={growthGroupRef} scale={INNER_SCALE} visible={false}>
            <primitive object={mesh} castShadow receiveShadow />
          </group>
        </animated.group>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['reversal-out'].geometry}
          material={outerMaterial}
          scale={INNER_SCALE}
          {...pointerHandlers}
        />
      </group>
    </group>
  );
}
