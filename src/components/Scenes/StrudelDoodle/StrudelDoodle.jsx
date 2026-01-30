/* eslint-disable unused-imports/no-unused-imports */

/* eslint-disable no-unused-vars */
import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Grid, Html, OrbitControls, shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

import useStrudelTrack from '../../../hooks/useStrudelTrack';
import { STRUDEL_TRACKS } from '../../../utils/tracks';
import Sun, { DoubleLayerSun } from './Sun';
import THEMES from './themes';

/* ----------------------------- helpers ----------------------------- */

function Floating({ children, speed = 0.25, amp = 0.6 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    if (!ref.current) return;
    ref.current.position.y = Math.sin(t) * amp;
    ref.current.rotation.y += 0.002;
    ref.current.rotation.x = Math.sin(t * 0.6) * 0.04;
  });

  return <group ref={ref}>{children}</group>;
}

/* ----------------------------- SKYDOME ----------------------------- */

const SkyMaterial = shaderMaterial(
  {
    uTop: new THREE.Color('#2b0f3f'),
    uBottom: new THREE.Color('#060010'),
  },
  /* glsl */ `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uTop;
    uniform vec3 uBottom;
    varying vec3 vPos;

    void main() {
      float h = normalize(vPos).y * 0.5 + 0.5;
      vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ SkyMaterial });

function SkyDome({ top, bottom }) {
  return (
    <mesh scale={200}>
      <sphereGeometry args={[1, 64, 64]} />
      <skyMaterial side={THREE.BackSide} uTop={top} uBottom={bottom} />
    </mesh>
  );
}

/* ----------------------------- GROUND OCCLUDER ----------------------------- */
/* Invisible depth-writing plane so you can’t see sky through the grid */

function GroundOccluder({ y = -2.401 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#000" transparent opacity={1} depthWrite />
    </mesh>
  );
}

/* ----------------------------- HORIZON SUN ----------------------------- */

const HorizonSunMaterial = shaderMaterial(
  {
    uColorTop: new THREE.Color('#ff9bf5'),
    uColorBottom: new THREE.Color('#ff2fa4'),
    uBands: 14,
    uHorizon: 0.35,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uBands;
    uniform float uHorizon;
    varying vec2 vUv;

    void main() {

      if (vUv.y < uHorizon) discard;

      float band = step(0.5, fract(vUv.y * uBands));

      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);
      vec3 color = grad * glow * 2.2;

      gl_FragColor = vec4(color, band);
    }
  `
);

extend({ HorizonSunMaterial });

function HorizonSun({
  colorTop,
  colorBottom,
  bands = 14,
  horizon = 0.35,
  ...props
}) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[2.4, 64, 64]} />
      <horizonSunMaterial
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uColorTop={colorTop}
        uColorBottom={colorBottom}
        uBands={bands}
        uHorizon={horizon}
      />
    </mesh>
  );
}

/* ----------------------------- scene ----------------------------- */

function VaporwaveScene({ theme }) {
  const fog = useMemo(() => new THREE.Fog(theme.fog, 10, 70), [theme]);

  return (
    <>
      <primitive attach="fog" object={fog} />

      <SkyDome top={theme.skyTop} bottom={theme.skyBottom} />

      <ambientLight intensity={0.6} />
      <pointLight position={[0, 6, -10]} intensity={3} color={theme.accent} />

      <HorizonSun
        position={[0, 2.4, -155]}
        scale={17}
        colorTop={theme.accent}
        colorBottom={theme.grid}
        bands={18}
        horizon={0.38}
      />

      {/* Invisible depth blocker */}
      <GroundOccluder y={-2.42} />

      <Grid
        position={[0, -2.4, 0]}
        args={[140, 140]}
        cellSize={1}
        sectionSize={6}
        infiniteGrid
        fadeDistance={70}
        fadeStrength={1}
        cellColor={theme.grid}
        sectionColor={theme.grid}
      />

      <Floating>
        <Sun
          position={[5, 9, -12]}
          colorTop="#ededed"
          colorBottom="#343434"
          bands={20}
        />
      </Floating>

      <Floating>
        <Sun
          position={[-1, -3, 2]}
          colorTop="#38daf6"
          colorBottom="#7e007e"
          bands={7}
        />
      </Floating>

      <Floating>
        <Sun
          scale={2.2}
          position={[-7, 0.5, -10]}
          colorTop="#b500b5"
          colorBottom="#00ff59"
          bands={16}
        />
      </Floating>

      <Floating>
        <DoubleLayerSun
          scale={2.2}
          position={[7, -0.5, 10]}
          colorTop="#b500b5"
          colorBottom="#00ff59"
          innerColorTop="#00ff59"
          innerColorBottom="#b500b5"
          bands={16}
        />
      </Floating>
      <Floating>
        <Sun
          scale={1.3}
          position={[4, -0.3, -7]}
          colorTop="#e020e6"
          colorBottom="#02c68e"
          bands={12}
        />
      </Floating>

      <Floating>
        <Sun
          scale={0.7}
          position={[-7, 0.5, 4]}
          colorTop="#0d00ff"
          colorBottom="#ff00ff"
          bands={16}
        />
      </Floating>

      <Floating>
        <Sun
          scale={0.7}
          position={[5.5, 6, 4]}
          colorTop="#ff0084"
          colorBottom="#0080ff"
          bands={16}
        />
        <DoubleLayerSun
          scale={0.2}
          position={[6.5, 7, 4.5]}
          colorTop="#ff0084"
          colorBottom="#0080ff"
          innerColorTop="#ffffff"
          innerColorBottom="#000000"
          bands={8}
        />
      </Floating>
    </>
  );
}

/* ----------------------------- main ----------------------------- */

export default function StrudelDoodle() {
  const { ready, play, stop, isPlaying } = useStrudelTrack({
    withSamples: true,
  });

  const PRESETS = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STRUDEL_TRACKS).map(([k, v]) => [k, v.toString()])
      ),
    []
  );

  const { themeName, presetName, autoPlay } = useControls('Strudelizer', {
    Theme: folder({
      themeName: { value: 'Miami', options: Object.keys(THEMES) },
    }),
    Track: folder({
      presetName: { value: 'defaultPattern', options: Object.keys(PRESETS) },
      autoPlay: false,
    }),
  });

  const theme = THEMES[themeName];
  const [code, setCode] = useState(STRUDEL_TRACKS.defaultPattern);

  useEffect(() => {
    const next = PRESETS[presetName];
    if (next) {
      setCode(next);
      if (autoPlay && ready) play(next);
    }
  }, [presetName, ready, autoPlay, play]);

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        target={[0, 1.5, 0]}
        minPolarAngle={Math.PI * 0.35}
        maxPolarAngle={Math.PI * 0.495}
      />

      <VaporwaveScene theme={theme} />

      <Html
        center
        transform
        // distanceFactor={1.1}
        position={[0, 2.5, -2]}
      >
        <div
          style={{
            width: 420,
            maxWidth: '90vw',
            background: `linear-gradient(180deg, ${theme.bg}, #000)`,
            color: theme.wire,
            padding: 16,
            fontFamily: 'monospace',
            borderRadius: 14,
            border: `1px solid ${theme.grid}`,
            boxShadow: `0 0 30px ${theme.grid}55, inset 0 0 30px #000`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: theme.accent }}>🎛 STRUDELIZER</strong>
            <span style={{ color: ready ? theme.wire : '#f33' }}>
              {ready ? 'ready' : 'loading'}
            </span>
          </div>

          <div style={{ color: isPlaying ? theme.wire : '#f44' }}>
            {isPlaying ? '▶ playing' : '■ stopped'}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={9}
            style={{
              width: '100%',
              background: '#000',
              color: theme.wire,
              border: `1px solid ${theme.grid}`,
              padding: 10,
              resize: 'none',
              borderRadius: 8,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => play(code)}>
              ▶ play
            </button>
            <button type="button" onClick={stop}>
              ■ stop
            </button>
          </div>

          <div style={{ fontSize: 11, opacity: 0.6 }}>
            First interaction must be a user tap (mobile audio unlock)
          </div>
        </div>
      </Html>
    </>
  );
}
