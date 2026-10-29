import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import FlameGPU from '@elements/Flame/FlameGPU';
import Smoke2DGPU from '@elements/Smoke/Smoke2DGPU';
import VolumetricSmokeParticlesGPU from '@elements/Smoke/VolumetricSmokeParticlesGPU';
import VolumetricFireGPU from '@elements/VolumetricFire/VolumetricFireGPU';
import { mirrorEnd } from '@modules/candle';
import BURNING_AT_BOTH_ENDS_FIRE from '@presets/fire/burningAtBothEndsFire';

const TOP_FIRE = BURNING_AT_BOTH_ENDS_FIRE.splines.find(
  (spline) => spline.name === 'Top Wick Fire'
);
const RIBBON = [
  [0, 0, 0],
  [0.02, 0.75, 0],
  [-0.03, 1.5, 0.02],
  [0.05, 2.25, 0],
  [0, 3, 0],
];

const ease = (t) => t * t * (3 - 2 * t);

// The flames the scene had before the sim — the displaced shader flame and
// the stacked volumetric slices — upright over each wick, the bottom one
// inverted, shrinking to nothing as the candle goes out.
export function LegacyFlames({ config, drive, placement }) {
  const refs = [useRef(null), useRef(null)];
  const { size, top } = placement;
  const origin = [top.base[0], top.base[1] + 0.21 * size, top.base[2]];
  const motion = {
    baseSpeed: config.flameBaseSpeed,
    fastAmp: config.flameFastAmp,
    fastFreq: config.flameFastFreq,
    microAmp: config.flameMicroAmp,
    microFreq: config.flameMicroFreq,
    minSpeed: config.flameMinSpeed,
    pulseAmp: config.flamePulseAmp,
    pulseFreq: config.flamePulseFreq,
    scaleX: 1,
    scaleY: 1,
    slowAmp: config.flameSlowAmp,
    slowFreq: config.flameSlowFreq,
    swayX: config.flameSwayX,
    swayZ: config.flameSwayZ,
  };
  const slices = {
    animSpeed: TOP_FIRE.fireAnimSpeed,
    animated: true,
    brightness: TOP_FIRE.fireBrightness * config.flameIntensity,
    depth: TOP_FIRE.fireDepth,
    gain: TOP_FIRE.fireGain,
    height: TOP_FIRE.fireHeight,
    lacunarity: TOP_FIRE.fireLacunarity,
    magnitude: TOP_FIRE.fireMagnitude,
    saturation: TOP_FIRE.fireSaturation,
    sliceSpacing: TOP_FIRE.fireSliceSpacing,
    tintColor: TOP_FIRE.fireTintColor,
    width: TOP_FIRE.fireWidth,
  };

  useFrame(() => {
    const scale =
      ease(drive.lit) *
      size *
      (config.flame === 'shader' ? 0.55 : 0.6) *
      (0.9 + 0.1 * drive.signal.emit);
    refs.forEach((ref) => {
      const group = ref.current;
      if (!group) return;
      group.visible = scale > 0.001;
      group.scale.setScalar(Math.max(scale, 1e-4));
    });
  }, -1);

  const one = (inverted) =>
    config.flame === 'slices' ? (
      <VolumetricFireGPU inverted={inverted} {...slices} />
    ) : (
      <FlameGPU inverted={inverted} motion={motion} />
    );
  return (
    <>
      <group position={origin} ref={refs[0]} userData={{ effect: 'flame' }}>
        {one(false)}
      </group>
      <group
        position={mirrorEnd(origin)}
        ref={refs[1]}
        userData={{ effect: 'flame' }}
      >
        {one(true)}
      </group>
    </>
  );
}

// The billboard sheet or the spline ribbon, off the flame tip or the wick.
export function LegacySmoke({ config, placement }) {
  const lit = config.flame !== 'out';
  const { top } = placement;
  const origin = lit
    ? top.flameTip
    : [top.tip[0], top.tip[1] + 0.01, top.tip[2]];
  const sheet = {
    color: config.smokeColor,
    height: config.smokeHeight,
    opacity: config.smokeSheetOpacity,
    riseSpeed: config.smokeRiseSpeed,
    spreadStrength: config.smokeSpreadStrength,
    timeFrequency: config.smokeTimeFrequency,
    uvFrequencyX: config.smokeUvFrequencyX,
    uvFrequencyY: config.smokeUvFrequencyY,
    width: config.smokeWidth,
  };
  const ribbon = useMemo(
    () => ({
      closed: false,
      fadeRate: config.volFadeRate,
      flowSpeed: 0.22,
      tension: 0.3,
      volBlendMode: 'Normal',
      volColor: config.smokeColor,
      volDamping: 0.06,
      volMaxDrift: config.volMaxDrift,
      volNoiseScale: 80,
      volOpacity: config.volOpacity,
      volParticleCount: config.volParticleCount,
      volSize: config.volSize,
      volSpread: config.volSpread,
      volSpringK: 1.2,
      volTurbulence: config.volTurbulence,
      volTurbulenceSpeed: config.volTurbulenceSpeed,
    }),
    [
      config.smokeColor,
      config.volFadeRate,
      config.volMaxDrift,
      config.volOpacity,
      config.volParticleCount,
      config.volSize,
      config.volSpread,
      config.volTurbulence,
      config.volTurbulenceSpeed,
    ]
  );
  const upPoints = useMemo(
    () => RIBBON.map((p) => new THREE.Vector3(...p)),
    []
  );
  const downPoints = useMemo(
    () => RIBBON.map((p) => new THREE.Vector3(...mirrorEnd(p))),
    []
  );

  if (config.smoke === 'billboard') {
    return (
      <group userData={{ effect: 'smoke' }}>
        <Smoke2DGPU position={origin} smoke={sheet} />
        <Smoke2DGPU inverted position={mirrorEnd(origin)} smoke={sheet} />
      </group>
    );
  }
  return (
    <group userData={{ effect: 'smoke' }}>
      <group position={origin}>
        <VolumetricSmokeParticlesGPU config={ribbon} points={upPoints} />
      </group>
      <group position={mirrorEnd(origin)}>
        <VolumetricSmokeParticlesGPU config={ribbon} points={downPoints} />
      </group>
    </group>
  );
}
