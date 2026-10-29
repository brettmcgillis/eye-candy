import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  color,
  float,
  positionLocal,
  reflector,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  FORM_KEYS,
  candleBounds,
  candleForm,
  candlePlacement,
} from '@modules/candle';
import { Backdrop, StudioEnvironment } from '@modules/renderStage';
import Bloom from '@postprocessing/WebGPU/bloom/Bloom';

import CurlSmokeLayer from './CurlSmokeLayer';
import { LegacyFlames, LegacySmoke } from './LegacyEnds';
import SimFlames from './SimFlames';
import WaxCandle from './WaxCandle';
import createDriver from './driver';

const FLAME_LIGHT = new THREE.Color('#ffa24a');

// A wide disc under the lower flame, fading out at its rim; `reflect`
// mirrors the candle in it.
function Floor({ config, y }) {
  const tint = useMemo(() => uniform(new THREE.Color()), []);
  const reflection = useMemo(() => {
    if (config.floor !== 'reflect') return null;
    const node = reflector({ resolutionScale: 0.5 });
    node.target.rotateX(-Math.PI / 2);
    return node;
  }, [config.floor]);
  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true });
    const r = positionLocal.xy.length();
    m.opacityNode = float(1).sub(smoothstep(6, 22, r));
    m.colorNode = reflection
      ? color(tint).add(reflection.rgb.mul(0.45))
      : color(tint);
    return m;
  }, [reflection, tint]);
  useEffect(() => () => material.dispose(), [material]);
  tint.value
    .set(
      config.look === 'realistic' ? config.floorColor : config.styleBackground
    )
    .multiplyScalar(config.look === 'realistic' ? 1 : 0.6);

  return (
    <group position={[0, y, 0]} userData={{ plot: false }}>
      {reflection ? <primitive object={reflection.target} /> : null}
      <mesh material={material} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[25, 96]} />
      </mesh>
    </group>
  );
}

function FlameLights({ config, drive, placement }) {
  const refs = [useRef(null), useRef(null)];
  const { top } = placement;
  const at = [
    top.flameCentre,
    [-top.flameCentre[0], -top.flameCentre[1], top.flameCentre[2]],
  ];
  useFrame(() => {
    const k =
      config.flameLight *
      drive.lit *
      drive.signal.light *
      (config.flameIntensity ?? 1);
    refs.forEach((ref, i) => {
      const light = ref.current;
      if (!light) return;
      light.intensity = 1.3 * k;
      light.visible = k > 0.001;
      light.position.set(
        at[i][0] + drive.signal.sway[0] * 3,
        at[i][1],
        at[i][2] + drive.signal.sway[1] * 3
      );
    });
  }, -1);
  return refs.map((ref, i) => (
    <pointLight
      color={FLAME_LIGHT}
      decay={2}
      distance={14}
      // eslint-disable-next-line react/no-array-index-key
      key={i}
      position={at[i]}
      ref={ref}
    />
  ));
}

// Cartoon keeps its flat colours (Neutral leaves saturation alone); the
// other looks are graded filmic.
function Exposure({ exposure, look }) {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    /* eslint-disable no-param-reassign */
    gl.toneMapping =
      look === 'cartoon'
        ? THREE.NeutralToneMapping
        : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
    /* eslint-enable no-param-reassign */
  }, [exposure, gl, look]);
  return null;
}

// The whole candle burning at both ends: wax and wicks under the tilt,
// upright flames and smoke at each end (the bottom end the top turned half a
// turn), their lights, the floor and the bloom. The Burning At Both Ends
// scene, CandleCLI's headless renderer and its Live tab all mount this.
// `snuffAt` puts the flames out mid-shot (`snuffed`, from now); `solidsRef` reaches the candle for
// depth and plots, `effectsRef` the sim and the smoke for read-back.
export default function CandleStage({
  config,
  effectsRef = null,
  snuffAt = null,
  snuffed = false,
  solidsRef = null,
  transparent = false,
}) {
  const drive = useMemo(createDriver, []);
  const formKey = FORM_KEYS.map((key) => config[key]).join('|');
  const form = useMemo(() => candleForm(config), [formKey]);
  const placement = useMemo(
    () => candlePlacement(config, form),
    [form, config.flameSize]
  );
  const bounds = useMemo(() => candleBounds(config, form), [config, form]);
  drive.config = config;
  useLayoutEffect(() => {
    drive.reset(config, snuffAt);
  }, [drive, form, snuffAt]);

  // The Live tab's Snuff: the flames go out from now.
  useEffect(() => {
    if (snuffed) drive.snuffAt = drive.t;
  }, [drive, snuffed]);

  useFrame((state, delta) => drive.advance(delta), -2);

  const backdrop =
    config.look === 'realistic'
      ? config.backgroundColor
      : config.styleBackground;
  const lit = config.flame !== 'out';
  const floorY = bounds.lowest - config.floorDrop;

  return (
    <>
      <Exposure exposure={config.exposure} look={config.look} />
      <Backdrop color={transparent ? null : backdrop} />
      {config.look === 'cartoon' ? null : (
        <StudioEnvironment intensity={config.look === 'clay' ? 0.45 : 0.25} />
      )}
      <ambientLight intensity={config.ambientIntensity} />
      <hemisphereLight args={['#8ea0b5', '#1a1410', 0.15]} />
      <directionalLight
        color="#fff2de"
        intensity={config.keyIntensity}
        position={[3.5, 7, 5.5]}
      />
      <directionalLight
        color="#9fb4d8"
        intensity={config.keyIntensity * 0.55}
        position={[-4, 3, -6]}
      />
      {config.look === 'clay' ? (
        <hemisphereLight args={['#fff4e8', '#3a2c24', 1.1]} />
      ) : null}
      <FlameLights config={config} drive={drive} placement={placement} />
      {config.floor !== 'none' && !transparent ? (
        <Floor config={config} y={floorY} />
      ) : null}

      <WaxCandle
        config={config}
        drive={drive}
        form={form}
        placement={placement}
        solidsRef={solidsRef}
      />

      {lit && config.flame === 'sim' ? (
        <SimFlames
          config={config}
          drive={drive}
          effectsRef={effectsRef}
          form={form}
          placement={placement}
        />
      ) : null}
      {lit && (config.flame === 'shader' || config.flame === 'slices') ? (
        <LegacyFlames config={config} drive={drive} placement={placement} />
      ) : null}

      {config.smoke === 'curl' ? (
        <CurlSmokeLayer
          config={config}
          drive={drive}
          effectsRef={effectsRef}
          placement={placement}
        />
      ) : null}
      {config.smoke === 'billboard' || config.smoke === 'ribbon' ? (
        <LegacySmoke config={config} placement={placement} />
      ) : null}

      {config.bloom ? (
        <Bloom
          radius={config.bloomRadius}
          strength={config.bloomStrength}
          threshold={
            config.look === 'cartoon'
              ? Math.max(1.1, config.bloomThreshold)
              : config.bloomThreshold
          }
        />
      ) : null}
    </>
  );
}
