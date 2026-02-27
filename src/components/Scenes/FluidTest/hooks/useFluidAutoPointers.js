import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

function createPointerState() {
  return {
    initialized: false,
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    phase: Math.random() * Math.PI * 4,
    seed: Math.random() * Math.PI * 2,
    ttl: 0,
    jitterOffset: {
      x: (Math.random() - 0.5) * 0.12,
      y: (Math.random() - 0.5) * 0.12,
    },
    freqMul: {
      a: 0.85 + Math.random() * 0.5,
      b: 0.7 + Math.random() * 0.6,
      c: 0.8 + Math.random() * 0.6,
    },
    ampMul: 1 + (Math.random() - 0.5) * 0.6,
    pathSpeedMul: 0.6 + Math.random() * 1.4,
  };
}

function sampleAutoCursor(phase, range, ap = {}) {
  const aMul = (ap.freqMul && ap.freqMul.a) || 0.97;
  const bMul = (ap.freqMul && ap.freqMul.b) || 0.41;
  const cMul = (ap.freqMul && ap.freqMul.c) || 1.81;
  const amp = (ap.ampMul || 1) * Math.max(0, range || 1.0);

  const x =
    0.5 +
    Math.sin(phase * aMul) * 0.26 * amp +
    Math.sin(phase * bMul + 1.4) * 0.13 * amp +
    Math.sin(phase * cMul + 0.3) * 0.05 * amp;
  const y =
    0.5 +
    Math.cos(phase * (1.13 * aMul)) * 0.24 * amp +
    Math.cos(phase * (0.53 * bMul) + 2.0) * 0.12 * amp +
    Math.cos(phase * (1.47 * cMul) + 0.9) * 0.05 * amp;

  const jitterX = (ap.jitterOffset && ap.jitterOffset.x) || 0;
  const jitterY = (ap.jitterOffset && ap.jitterOffset.y) || 0;

  return {
    x: THREE.MathUtils.clamp(x + jitterX, 0.05, 0.95),
    y: THREE.MathUtils.clamp(y + jitterY, 0.05, 0.95),
  };
}

export default function useFluidAutoPointers({ config, size }) {
  const autoPointersRef = useRef([createPointerState()]);

  const speedScale = useMemo(() => 0.01, []);

  useFrame((_, delta) => {
    const dt = Math.min(0.033, delta);
    const {
      autoSplat,
      autoSplatRate,
      autoSplatRange,
      autoSplatCount,
      colorCycleSpeed,
      debugContactFadeDuration,
    } = config;

    const count = Math.max(1, Math.floor(autoSplatCount || 1));

    while (autoPointersRef.current.length < count) {
      autoPointersRef.current.push(createPointerState());
    }

    const basePathSpeed = 0.95 * (0.7 + Math.max(0, colorCycleSpeed) * 0.5);
    const rateScale = Math.max(0, autoSplatRate) / 100;

    for (let i = 0; i < autoPointersRef.current.length; i += 1) {
      const ap = autoPointersRef.current[i];
      if (!ap) {
        // no-op
      } else {
        ap.ttl = Math.max(0, (ap.ttl || 0) - dt);

        if (typeof ap.phase !== 'number') {
          ap.phase = Math.random() * Math.PI * 4;
        }
        ap.phase += dt * basePathSpeed * (ap.pathSpeedMul || 1) * rateScale;

        const phase = ap.phase + (ap.seed || 0);
        const target = sampleAutoCursor(phase, autoSplatRange, ap);

        if (!ap.initialized) {
          ap.initialized = true;
          ap.x = target.x + ((ap.jitterOffset && ap.jitterOffset.x) || 0);
          ap.y = target.y + ((ap.jitterOffset && ap.jitterOffset.y) || 0);
        }

        const rate = autoSplatRate;
        const prevX = ap.x;
        const prevY = ap.y;

        if (rate <= 0 || (prevX === target.x && prevY === target.y)) {
          ap.vx = 0;
          ap.vy = 0;
        } else {
          const speed = rate * speedScale;
          const dx = target.x - prevX;
          const dy = target.y - prevY;
          const dist = Math.hypot(dx, dy);

          if (dist < 1e-6) {
            ap.vx = 0;
            ap.vy = 0;
          } else {
            const maxMove = speed * dt;
            let nextX = target.x;
            let nextY = target.y;

            if (dist > maxMove) {
              const inv = 1 / dist;
              nextX = prevX + dx * inv * maxMove;
              nextY = prevY + dy * inv * maxMove;
            }

            let dvx = nextX - prevX;
            let dvy = nextY - prevY;
            if (size.width > size.height) {
              dvx *= size.width / Math.max(1, size.height);
            } else {
              dvy *= size.height / Math.max(1, size.width);
            }

            ap.x = nextX;
            ap.y = nextY;
            ap.vx = dvx;
            ap.vy = dvy;
          }
        }

        if (autoSplat && i < count) {
          ap.ttl = Math.max(0.05, debugContactFadeDuration);
        }
      }
    }
  });

  return autoPointersRef;
}
