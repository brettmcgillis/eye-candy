/* eslint-disable unused-imports/no-unused-imports */

/* eslint-disable no-unused-vars */
import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Grid, Html, OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import useStrudelTrack from '../../../hooks/useStrudelTrack';
import { STRUDEL_TRACKS } from '../../../utils/tracks';
import Sun, { DoubleLayerSun } from './Sun';
import THEMES from './themes';

/* ----------------------------- helpers ----------------------------- */

function Floating({ children, speed = 0.25, amp = 0.6 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = Math.sin(t) * amp;
    ref.current.rotation.y += 0.002;
    ref.current.rotation.x = Math.sin(t * 0.6) * 0.04;
  });

  return <group ref={ref}>{children}</group>;
}

function WireMaterial({ color, opacity = 0.85 }) {
  return (
    <meshBasicMaterial
      wireframe
      transparent
      toneMapped={false}
      color={color}
      opacity={opacity}
    />
  );
}

/* ----------------------------- scene ----------------------------- */

function VaporwaveScene({ theme }) {
  const fog = useMemo(() => new THREE.Fog(theme.fog, 10, 70), [theme]);

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <primitive attach="fog" object={fog} />

      <ambientLight intensity={0.6} />
      <pointLight position={[0, 6, -10]} intensity={3} color={theme.accent} />

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
          innterColorTop="#00ff59"
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
    () => ({
      ...Object.fromEntries(
        Object.entries(STRUDEL_TRACKS).map(([key, value]) => [
          key,
          value.toString(),
        ])
      ),
    }),
    []
  );

  const { themeName, presetName, autoPlay } = useControls('Strudelizer', {
    Theme: folder({
      themeName: {
        value: 'Miami',
        options: Object.keys(THEMES),
      },
    }),
    Track: folder({
      presetName: {
        value: PRESETS[0] ?? 'defaultPattern',
        options: Object.keys(PRESETS),
      },
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
  }, [presetName]);

  /* ----------------------------- UI ----------------------------- */

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.55}
        minPolarAngle={Math.PI * 0.35}
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
