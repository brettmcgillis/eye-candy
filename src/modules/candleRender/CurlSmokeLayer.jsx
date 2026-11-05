import React, { useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createCurlSmoke } from '@modules/curlSmoke';

import { createClayMaterial } from './styleMaterials';

const clayMaterial = (u, colorNode) =>
  createClayMaterial(u, colorNode, { scale: 3 });

const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);

// The sorted curl-noise smoke over both wicks. While the candle burns it
// leaves the flame's tip; once out, the wick itself.
export default function CurlSmokeLayer({
  config,
  drive,
  effectsRef,
  placement,
}) {
  const gl = useThree((state) => state.gl);
  const smoke = useMemo(
    () =>
      createCurlSmoke({
        clayMaterial,
        count: config.smokeCount,
        look: config.look,
        mirror: true,
      }),
    [config.look, config.smokeCount]
  );
  useEffect(() => () => smoke.dispose(), [smoke]);

  const u = smoke.uniforms;
  u.color.value.set(config.smokeColor);
  const styled = config.look !== 'realistic';
  u.curl.value =
    config.smokeCurl * { cartoon: 0.3, clay: 0.45, realistic: 1 }[config.look];
  u.curlScale.value = styled
    ? Math.min(config.smokeCurlScale, 1.1)
    : config.smokeCurlScale;
  u.curlSpeed.value = config.smokeCurlSpeed;
  u.laminar.value = config.smokeLaminar * (styled ? 1.8 : 1);
  u.life.value = config.smokeLife;
  u.opacity.value = config.smokeOpacity;
  u.rise.value = config.smokeRise;
  smoke.setSeed(config.smokeSeed);
  u.size.value = config.smokeSize;
  u.spread.value = config.smokeSpread * (styled ? 0.35 : 1);
  u.sway.value = config.smokeSway;
  u.ink.value.set(config.toonInk);
  u.inkWidth.value = config.toonOutline * 1.4;
  u.prints.value = config.clayPrints;

  const { top } = placement;
  const wick = [top.tip[0], top.tip[1] + 0.012, top.tip[2]];

  useFrame(() => {
    // Stylised flames are opaque and drawn over their smoke, so it leaves
    // from inside them and the flame hides where it starts.
    const tip = styled
      ? [top.tip[0], top.tip[1] + 0.2 * placement.size, top.tip[2]]
      : top.flameTip;
    const emitter = mix(wick, tip, drive.lit);
    u.emitterTop.value.set(...emitter);
    u.emitterBottom.value.set(-emitter[0], -emitter[1], emitter[2]);
    u.flameTop.value.set(...top.flameCentre);
    u.flameBottom.value.set(
      -top.flameCentre[0],
      -top.flameCentre[1],
      top.flameCentre[2]
    );
    u.flameLight.value = config.smokeLight * drive.lit * drive.signal.light;
    u.amount.value = Math.min(1, drive.smoke * 1.6);
    u.opacity.value = config.smokeOpacity * Math.max(1, drive.smoke);
    smoke.advance(gl, drive.delta);
  }, -1);

  useFrame((state) => {
    if (smoke.sorted) {
      smoke.sort(gl, state.camera.getWorldPosition(new THREE.Vector3()));
    }
  });

  if (effectsRef) {
    // eslint-disable-next-line no-param-reassign
    effectsRef.current = {
      ...effectsRef.current,
      smoke: {
        look: smoke.look,
        mesh: smoke.mesh,
        uniforms: smoke.uniforms,
        readBalls: () => smoke.readBalls(gl),
        read: async () => {
          const { count, motion, state } = await smoke.read(gl);
          const emitter = u.emitterTop.value.toArray();
          const dots = [];
          const life = config.smokeLife;
          for (let i = 0; i < count; i += 1) {
            const age = state[i * 4 + 3];
            if (age > 0 && motion[i * 4 + 3] >= 0) {
              const share = Math.min(1, age / life);
              const alpha =
                config.smokeOpacity *
                Math.min(1, share / 0.08) *
                (1 - share) ** 1.4 *
                Math.min(1, drive.smoke);
              const x = state[i * 4];
              const y = state[i * 4 + 1];
              const z = state[i * 4 + 2];
              dots.push([
                emitter[0] + x,
                emitter[1] + y,
                emitter[2] + z,
                alpha,
              ]);
              dots.push([
                -emitter[0] - x,
                -emitter[1] - y,
                emitter[2] + z,
                alpha,
              ]);
            }
          }
          return dots;
        },
      },
    };
  }

  return <primitive object={smoke.mesh} />;
}
