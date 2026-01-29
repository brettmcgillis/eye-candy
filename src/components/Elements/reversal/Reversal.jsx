import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

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
          <mesh
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
          </mesh>
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
  glowIntensity = 2.5,
  onClick,
  ...props
}) {
  const [isOn, setIsOn] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#000000',
        side: THREE.DoubleSide,
      }),
    []
  );

  const { pressY, emissive } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    emissive: isOn ? glowIntensity : 0,
    config: (key) =>
      key === 'pressY'
        ? { mass: 0.6, tension: 300, friction: 14 }
        : { mass: 1, tension: 120, friction: 20 },
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
      outerMaterial={outerMaterial}
      outerProps={pointerHandlers}
      innerMaterial={
        <animated.meshStandardMaterial
          attach="material"
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={emissive}
          side={THREE.DoubleSide}
        />
      }
      innerProps={{
        positionY: pressY,
        ...pointerHandlers,
      }}
    />
  );
}

/* ========================================================================
   Preload
======================================================================== */

useGLTF.preload(modelFile('Reversal.glb'));
