import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import BigGulp from '../../../../../elements/BigGulp/BigGulp';
import SnickersModel from '../../../../../elements/Snickers/Snickers';
import SodaCanModel from '../../../../../elements/SodaCan/SodaCan';
import Moon from '../../../../../elements/moon/Moon';

const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_SCALE = Object.freeze({ x: 1, y: 1, z: 1 });

const FOOD_BODY_VISUALS = [
  {
    Component: SodaCanModel,
    baseScale: 0.12,
    modelRotation: [0.2, 0, 0],
    rotationOffset: [0.3, 0.1, -0.2],
    spinRates: [1.15, 1.6, -0.75],
  },
  {
    Component: BigGulp,
    baseScale: 0.08,
    modelRotation: [0, Math.PI / 5, 0],
    rotationOffset: [-0.4, 0.2, 0.35],
    spinRates: [0.95, -1.1, 0.8],
  },
  {
    Component: SnickersModel,
    baseScale: 0.18,
    modelRotation: [-0.2, Math.PI / 2, 0],
    rotationOffset: [0.25, -0.3, 0.15],
    spinRates: [-0.85, 1.3, 1.05],
  },
];

const SPACE_BODY_VISUALS = [
  {
    Component: Moon,
    baseScale: 1,
    modelRotation: [0, 0, 0],
    rotationOffset: [0.12, 0.05, -0.08],
    spinRates: [0.12, 0.18, -0.06],
    createComponentProps: (body) => ({
      color: body.color,
      emissive: body.color,
      emissiveIntensity: 0.04,
      metalness: 0.06,
      roughness: 0.92,
      segments: 48,
    }),
  },
  {
    Component: Moon,
    baseScale: 1,
    modelRotation: [0, 0, 0],
    rotationOffset: [-0.1, 0.18, 0.06],
    spinRates: [0.09, -0.14, 0.05],
    createComponentProps: (body) => ({
      color: body.color,
      emissive: body.color,
      emissiveIntensity: 0.03,
      metalness: 0.08,
      roughness: 0.88,
      segments: 40,
    }),
  },
  {
    Component: Moon,
    baseScale: 1,
    modelRotation: [0, 0, 0],
    rotationOffset: [0.08, -0.12, 0.14],
    spinRates: [-0.07, 0.11, 0.09],
    createComponentProps: (body) => ({
      color: body.color,
      emissive: body.color,
      emissiveIntensity: 0.05,
      metalness: 0.04,
      roughness: 0.95,
      segments: 56,
    }),
  },
];

function getBodyVisuals(presentationMode) {
  return presentationMode === 'storeWarp'
    ? FOOD_BODY_VISUALS
    : SPACE_BODY_VISUALS;
}

function readBodyConfig(config, index) {
  const n = index + 1;

  return {
    enabled: config[`body${n}Enabled`] ? 1 : 0,
    color: config[`body${n}Color`] ?? '#ffffff',
    orbitRadius: config[`body${n}OrbitRadius`] ?? 9,
    orbitSpeed: config[`body${n}OrbitSpeed`] ?? 0.5,
    orbitPhase: (config[`body${n}OrbitPhase`] ?? 0) * DEG_TO_RAD,
    height: config[`body${n}Height`] ?? 0,
    radius: config[`body${n}Size`] ?? 1,
  };
}

const OrbitingProps = memo(function OrbitingProps({ config }) {
  const groupRef = useRef(null);
  const bodyRefs = useRef([]);

  const position = config.blackHolePosition ?? DEFAULT_POSITION;
  const rotation = config.blackHoleRotation ?? DEFAULT_ROTATION;
  const scale = config.blackHoleScale ?? DEFAULT_SCALE;

  const orbitingBodies = useMemo(() => {
    const visuals = getBodyVisuals(config.presentationMode);

    return visuals.map((visual, index) => {
      const bodyConfig = readBodyConfig(config, index);

      return {
        ...bodyConfig,
        ...visual,
        componentProps:
          visual.createComponentProps?.(bodyConfig, index) ||
          visual.componentProps ||
          {},
      };
    });
  }, [config]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    orbitingBodies.forEach((body, index) => {
      const bodyRef = bodyRefs.current.at(index);

      if (!bodyRef) {
        return;
      }

      bodyRef.visible = Boolean(body.enabled);

      if (!body.enabled) {
        return;
      }

      const angle = time * body.orbitSpeed + body.orbitPhase;
      const [spinX, spinY, spinZ] = body.spinRates;
      const [rotationX, rotationY, rotationZ] = body.rotationOffset;

      bodyRef.position.set(
        Math.cos(angle) * body.orbitRadius,
        body.height,
        Math.sin(angle) * body.orbitRadius
      );
      bodyRef.rotation.set(
        rotationX + time * spinX,
        angle + rotationY + time * spinY,
        rotationZ + time * spinZ
      );
      bodyRef.scale.setScalar(Math.max(body.radius * body.baseScale, 0.001));
    });
  });

  return (
    <group
      ref={groupRef}
      position={[position.x ?? 0, position.y ?? 0, position.z ?? 0]}
      rotation={[
        (rotation.x ?? 0) * DEG_TO_RAD,
        (rotation.y ?? 0) * DEG_TO_RAD,
        (rotation.z ?? 0) * DEG_TO_RAD,
      ]}
      scale={[scale.x ?? 1, scale.y ?? 1, scale.z ?? 1]}
    >
      {orbitingBodies.map(
        ({ Component, componentProps, enabled, modelRotation }, index) => (
          <group
            key={`orbiting-prop-${index + 1}`}
            ref={(node) => {
              bodyRefs.current[index] = node;
            }}
            visible={Boolean(enabled)}
          >
            <group rotation={modelRotation}>
              <Component {...componentProps} />
            </group>
          </group>
        )
      )}
    </group>
  );
});

export default OrbitingProps;
