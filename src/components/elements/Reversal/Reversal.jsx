import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

/* ========================================================================
   Generic base (new third variation)
======================================================================== */

export function ReversalBase({
  innerMaterial = null,
  outerMaterial = null,
  innerProps = {},
  outerProps = {},
  ...props
}) {
  const { nodes } = useGLTF(modelFile('Reversal.glb'));

  const isJSX = (m) => React.isValidElement(m);

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {innerMaterial && (
          <animated.mesh
            castShadow
            receiveShadow
            geometry={nodes['reversal-in'].geometry}
            scale={[10, 1.018, 10]}
            {...innerProps}
          >
            {isJSX(innerMaterial) ? (
              innerMaterial
            ) : (
              <primitive attach="material" object={innerMaterial} />
            )}
          </animated.mesh>
        )}

        {outerMaterial && (
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['reversal-out'].geometry}
            scale={[10, 1.018, 10]}
            {...outerProps}
          >
            {isJSX(outerMaterial) ? (
              outerMaterial
            ) : (
              <primitive attach="material" object={outerMaterial} />
            )}
          </mesh>
        )}
      </group>
    </group>
  );
}

/* ========================================================================
   Static colored version (existing default export)
======================================================================== */

export default function Reversal({
  innerColor = '#FF0000',
  innerColorEmissive = false,
  innerColorEmissiveIntensity = 0,
  outerColor = '#000000',
  outerColorEmissive = false,
  outerColorEmissiveIntensity = 0,
  ...props
}) {
  const innerMaterial = useMemo(() => {
    if (!innerColor) return null;

    return new THREE.MeshStandardMaterial({
      color: innerColorEmissive ? null : innerColor,
      emissive: innerColorEmissive ? innerColor : null,
      emissiveIntensity: innerColorEmissiveIntensity,
      side: THREE.DoubleSide,
    });
  }, [innerColor, innerColorEmissive, innerColorEmissiveIntensity]);

  const outerMaterial = useMemo(() => {
    if (!outerColor) return null;

    return new THREE.MeshStandardMaterial({
      color: outerColorEmissive ? null : outerColor,
      emissive: outerColorEmissive ? outerColor : null,
      emissiveIntensity: outerColorEmissiveIntensity,
      side: THREE.DoubleSide,
    });
  }, [outerColor, outerColorEmissive, outerColorEmissiveIntensity]);

  return (
    <ReversalBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
    />
  );
}

/* ========================================================================
   Interactive animated version
======================================================================== */

export function InteractiveReversal({
  pressDepth = 0.015,
  emissiveIntensity = 2.5,
  innerColor = '#ff0000',
  outerColor = '#000000',
  onClick,
  ...props
}) {
  const [isOn, setIsOn] = useState(true);
  const [isPressed, setIsPressed] = useState(false);

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
      new THREE.MeshStandardMaterial({
        color: outerColor,
        side: THREE.DoubleSide,
      }),
    [outerColor]
  );

  const { pressY } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    config: { mass: 0.6, tension: 300, friction: 14 },
  });

  useFrame(() => {
    if (!innerMaterial) return;
    innerMaterial.emissiveIntensity = isOn ? emissiveIntensity : 0;
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
    <ReversalBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      outerProps={pointerHandlers}
      innerProps={{
        'position-y': pressY,
        ...pointerHandlers,
      }}
    />
  );
}

/* ========================================================================
   Nodes (for consumers that need the raw meshes)
======================================================================== */

export function useReversalNodes() {
  const { nodes } = useGLTF(modelFile('Reversal.glb'));

  return useMemo(
    () => ({ inner: nodes['reversal-in'], outer: nodes['reversal-out'] }),
    [nodes]
  );
}

/* ========================================================================
   Preload
======================================================================== */

useGLTF.preload(modelFile('Reversal.glb'));
