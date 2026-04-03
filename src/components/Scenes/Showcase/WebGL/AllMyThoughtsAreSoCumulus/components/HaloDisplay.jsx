import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { radians } from '../../../../../../utils/math';
import Lb45Plate from '../../../../../elements/45lbPlate/45lbPlate';
import Atom from '../../../../../elements/Atom/Atom';
import Halo from '../../../../../elements/halo/Halo';
import NeuralNetwork from '../../../../../elements/network/NeuralNetwork';
import Record from '../../../../../elements/record/Record';
import useHaloAnimation from '../hooks/useHaloAnimation';
import { HALO_PRESET_ORDER } from '../presets';
import {
  buildNetworkConfig,
  buildRingsConfig,
} from '../utils/buildHaloConfigs';
import CRTStaticRing from './CRTStaticRing';

const HALO_MODEL_ROTATION_BY_TYPE = {
  atomic: [Math.PI / 2, 0, 0],
  network: [Math.PI / 2, 0, 0],
};

/**
 * Renders the active halo type at a shared position/rotation/scale.
 * All halo components are wrapped in an outer group so the animation ref
 * applied in the scene always targets a stable Object3D.
 */
const HaloDisplay = memo(function HaloDisplay({ controls, setControls }) {
  const { haloType } = controls;
  const presetIndexRef = useRef(HALO_PRESET_ORDER.indexOf(controls.preset));
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    presetIndexRef.current = HALO_PRESET_ORDER.indexOf(controls.preset);
  }, [controls.preset]);

  useFrame(({ clock }) => {
    if (!controls.haloScrollEnabled) return;

    const now = clock.elapsedTime;
    if (now - lastScrollTimeRef.current >= controls.haloScrollInterval) {
      lastScrollTimeRef.current = now;
      presetIndexRef.current =
        (presetIndexRef.current + 1) % HALO_PRESET_ORDER.length;
      const nextPreset = HALO_PRESET_ORDER[presetIndexRef.current];
      setControls({ preset: nextPreset });
    }
  });

  const appearanceByType = {
    rings: {
      position: controls.ringsPosition,
      rotation: controls.ringsRotation,
      visible: controls.ringsVisible,
      scale: controls.ringsScale ?? controls.haloScale ?? 0.9,
    },
    record: {
      position: controls.recordPosition,
      rotation: controls.recordRotation,
      visible: controls.recordVisible,
      scale: controls.recordScale ?? controls.haloScale ?? 12,
    },
    network: {
      position: controls.networkPosition,
      rotation: controls.networkRotation,
      visible: controls.networkVisible,
      scale: controls.networkScale ?? controls.haloScale ?? 0.53,
    },
    plate: {
      position: controls.platePosition,
      rotation: controls.plateRotation,
      visible: controls.plateVisible,
      scale: controls.plateScale ?? controls.haloScale ?? 0.18,
    },
    atomic: {
      position: controls.atomPosition,
      rotation: controls.atomRotation,
      visible: controls.atomVisible,
      scale: controls.atomScale ?? controls.haloScale ?? 1.05,
    },
    crtStaticRing: {
      position: controls.crtStaticRingPosition,
      rotation: controls.crtStaticRingRotation,
      visible: controls.crtStaticRingVisible,
      scale: controls.crtStaticRingScale ?? controls.haloScale ?? 0.9,
    },
  };

  const activeAppearance = appearanceByType[haloType] ?? {
    position: { x: 0, y: 1.5, z: -1 },
    rotation: { x: 45, y: 0, z: 0 },
    visible: true,
    scale: controls.haloScale ?? 1,
  };

  const haloRef = useHaloAnimation({
    animate: controls.animate,
    speed: controls.speed,
    wobble: controls.wobble,
    wobbleSpeed: controls.wobbleSpeed,
    wobbleAngle: controls.wobbleAngle,
    baseRotationX: radians(activeAppearance.rotation.x),
  });

  const position = useMemo(
    () => [
      activeAppearance.position.x,
      activeAppearance.position.y,
      activeAppearance.position.z,
    ],
    [
      activeAppearance.position.x,
      activeAppearance.position.y,
      activeAppearance.position.z,
    ]
  );

  const rotation = useMemo(
    () => [
      radians(activeAppearance.rotation.x),
      radians(activeAppearance.rotation.y),
      radians(activeAppearance.rotation.z),
    ],
    [
      activeAppearance.rotation.x,
      activeAppearance.rotation.y,
      activeAppearance.rotation.z,
    ]
  );

  const ringsConfig = useMemo(
    () => buildRingsConfig(controls),
    [
      controls.ringsStyle,
      controls.ringsInnerRadius,
      controls.ringsOuterRadius,
      controls.ringsStart,
      controls.ringsEnd,
      controls.ringsSteps,
      controls.ringsSm,
      controls.ringsMed,
      controls.ringsLg,
      controls.ringsXl,
      controls.ringsSilver,
      controls.ringsWhite,
      controls.ringsBlack,
      controls.ringsBlue,
      controls.ringsLightblue,
    ]
  );

  const networkConfig = useMemo(
    () => buildNetworkConfig(controls),
    [
      controls.networkPointColor,
      controls.networkLineColor,
      controls.networkPointSize,
      controls.networkParticleCount,
      controls.networkMaxDistance,
      controls.networkAngularSpeed,
      controls.networkTimeScale,
    ]
  );

  const modelRotation = HALO_MODEL_ROTATION_BY_TYPE[haloType] || [0, 0, 0];

  return (
    <group
      ref={haloRef}
      position={position}
      rotation={rotation}
      scale={activeAppearance.scale}
      visible={activeAppearance.visible}
    >
      <group rotation={modelRotation}>
        {haloType === 'rings' && <Halo {...ringsConfig} />}
        {haloType === 'record' && <Record sideA={controls.recordSideA} />}
        {haloType === 'network' && <NeuralNetwork {...networkConfig} />}
        {haloType === 'plate' && <Lb45Plate />}
        {haloType === 'atomic' && (
          <Atom
            atomicNumber={controls.atomicNumber}
            animateElectrons={controls.atomAnimateElectrons}
            shellSpacing={controls.atomShellSpacing}
          />
        )}
        {haloType === 'crtStaticRing' && (
          <CRTStaticRing
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            innerRadius={controls.crtStaticRingInnerRadius}
            outerRadius={controls.crtStaticRingOuterRadius}
            snowAmount={controls.crtStaticRingSnowAmount}
            snowScale={controls.crtStaticRingSnowScale}
            snowSpeed={controls.crtStaticRingSnowSpeed}
            snowSize={controls.crtStaticRingSnowSize}
            snap={controls.crtStaticRingSnap}
            bandStrength={controls.crtStaticRingBandStrength}
            bandSpeed={controls.crtStaticRingBandSpeed}
            bandScale={controls.crtStaticRingBandScale}
            rfStrength={controls.crtStaticRingRFStrength}
            rfScale={controls.crtStaticRingRFScale}
            rfSpeed={controls.crtStaticRingRFSpeed}
            curvature={controls.crtStaticRingCurvature}
            vignette={controls.crtStaticRingVignette}
          />
        )}
      </group>
    </group>
  );
});

export default HaloDisplay;
