/* eslint-disable no-nested-ternary */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import algorithms from '../../../../TestLab/WebGL/ParticleLab/particleAlgorithms';
import { buildPhases, createCircleTexture, evolveParams } from '../utils/utils';

const alg = algorithms.Mycelium;

function buildSimState(pointCount) {
  const sim = alg.createSimState(pointCount);

  // Compute normalisation scale (target ~15 world units)
  const pos = sim.positions;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let i = 0; i < pos.length; i += 3) {
    cx += pos[i];
    cy += pos[i + 1];
    cz += pos[i + 2];
  }
  cx /= pointCount;
  cy /= pointCount;
  cz /= pointCount;

  let maxDist = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const dx = pos[i] - cx;
    const dy = pos[i + 1] - cy;
    const dz = pos[i + 2] - cz;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > maxDist) maxDist = d;
  }

  return { sim, scale: 15.0 / (maxDist || 1), cx, cy, cz };
}

// ---------------------------------------------------------------------------
// MyceliumCloud
// ---------------------------------------------------------------------------

export default function MyceliumCloud({ config, setConfig }) {
  const groupRef = useRef();
  const pointsRef = useRef();
  const geometryRef = useRef();
  const texture = useMemo(createCircleTexture, []);

  const simRef = useRef(null);
  const scaleRef = useRef(1);
  const prevPointCountRef = useRef(null);

  // Evolve / glitch state (all per-instance, seeded at mount)
  const phasesRef = useRef(buildPhases());
  const elapsedRef = useRef(0);
  const simParamsRef = useRef(evolveParams(0, phasesRef.current));
  const writebackTimerRef = useRef(0);
  const glitchRef = useRef({
    active: false,
    endTime: 0,
    nextCheck: 10 + Math.random() * 8,
  });

  // (Re)init sim when pointCount changes
  useEffect(() => {
    if (prevPointCountRef.current === config.pointCount) return;
    prevPointCountRef.current = config.pointCount;

    const { sim, scale, cx, cy, cz } = buildSimState(config.pointCount);
    simRef.current = sim;
    scaleRef.current = scale;

    if (!geometryRef.current) return;

    const pos = sim.positions;
    const scaled = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      scaled[i] = (pos[i] - cx) * scale;
      scaled[i + 1] = (pos[i + 1] - cy) * scale;
      scaled[i + 2] = (pos[i + 2] - cz) * scale;
    }
    const colors = new Float32Array(pos.length).fill(0.5);

    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(scaled, 3)
    );
    geometryRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }, [config.pointCount]);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const geometry = geometryRef.current;
    if (!sim || !geometry) return;

    // --- Param evolution ---
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const glitch = glitchRef.current;

    if (glitch.active) {
      if (t >= glitch.endTime) {
        glitch.active = false;
        glitch.nextCheck = t + 10 + Math.random() * 12;
      }
      // glitch params stay frozen in simParamsRef until we snap back
    } else if (config.glitchEnabled && t >= glitch.nextCheck) {
      if (Math.random() < 0.25) {
        glitch.active = true;
        glitch.endTime = t + 2 + Math.random() * 2.5;
        simParamsRef.current = {
          ...simParamsRef.current,
          temperature: 1.5 + Math.random() * 1.5,
          equilibrium: 0.4 + Math.random() * 4,
          coherence: 0.4 + Math.random() * 3.5,
          freeEnergy: 0.1 + Math.random() * 2.8,
        };
      } else {
        glitch.nextCheck = t + 10 + Math.random() * 12;
      }
    } else if (config.autoEvolve) {
      simParamsRef.current = evolveParams(t, phasesRef.current);

      // Write evolved values back to Leva ~once/sec so sliders stay current.
      // Skip during glitch so extreme values don't bleed into the controls.
      if (setConfig) {
        writebackTimerRef.current += delta;
        if (writebackTimerRef.current >= 1.0) {
          writebackTimerRef.current = 0;
          const p = simParamsRef.current;
          const fmt = (v, d = 3) => parseFloat(v.toFixed(d));
          setConfig({
            temperature: fmt(p.temperature),
            equilibrium: fmt(p.equilibrium),
            coherence: fmt(p.coherence),
            scaleDepth: fmt(p.scaleDepth),
            freeEnergy: fmt(p.freeEnergy),
            boundRadius: fmt(p.boundRadius, 1),
            viscosity: fmt(p.viscosity, 4),
            mass: fmt(p.mass),
            maxSpeed: fmt(p.maxSpeed, 1),
            halfLife: fmt(p.halfLife, 4),
          });
        }
      }
    } else {
      simParamsRef.current = {
        temperature: config.temperature,
        equilibrium: config.equilibrium,
        coherence: config.coherence,
        scaleDepth: config.scaleDepth,
        freeEnergy: config.freeEnergy,
        boundRadius: config.boundRadius,
        viscosity: config.viscosity,
        mass: config.mass,
        maxSpeed: config.maxSpeed,
        halfLife: config.halfLife,
      };
    }

    // --- Orbit position ---
    if (groupRef.current) {
      const phases = phasesRef.current;
      if (config.orbit) {
        const r = config.orbitRadius;
        const s = config.orbitSpeed;
        groupRef.current.position.set(
          config.offsetX + r * Math.sin(t * s * phases.orbitX),
          config.offsetY +
            r * 0.6 * Math.sin(t * s * phases.orbitY + Math.PI * 0.7),
          config.offsetZ +
            r * 0.8 * Math.sin(t * s * phases.orbitZ + Math.PI * 1.3)
        );
      } else {
        groupRef.current.position.set(
          config.offsetX,
          config.offsetY,
          config.offsetZ
        );
      }
    }

    // --- Advance sim ---
    alg.update(sim, simParamsRef.current);

    const posAttr = geometry.attributes.position;
    const colorAttr = geometry.attributes.color;
    if (!posAttr || !colorAttr) return;

    // Write scaled positions
    const positions = posAttr.array;
    const scale = scaleRef.current;
    const simPos = sim.positions;
    const writeLen = Math.min(positions.length, simPos.length);
    for (let i = 0; i < writeLen; i += 1) {
      positions[i] = simPos[i] * scale;
    }
    posAttr.needsUpdate = true;

    // --- Velocity-based coloring (time-sliced) ---
    const colors = colorAttr.array;
    const vel = sim.velocities;
    const count = sim.masses.length;

    const SLICES = 4;
    const slice = (sim.frameCounter - 1 + SLICES) % SLICES;
    const colorStart = Math.floor((count * slice) / SLICES);
    const colorEnd = Math.floor((count * (slice + 1)) / SLICES);

    let peakSpdSq = 0;
    for (let j = colorStart; j < colorEnd; j += 1) {
      const vi = j * 3;
      const sSq =
        vel[vi] * vel[vi] +
        vel[vi + 1] * vel[vi + 1] +
        vel[vi + 2] * vel[vi + 2];
      if (sSq > peakSpdSq) peakSpdSq = sSq;
    }
    const peakSpd = Math.sqrt(peakSpdSq) || 1;

    const c1r = parseInt(config.color1.slice(1, 3), 16) / 255;
    const c1g = parseInt(config.color1.slice(3, 5), 16) / 255;
    const c1b = parseInt(config.color1.slice(5, 7), 16) / 255;
    const c2r = parseInt(config.color2.slice(1, 3), 16) / 255;
    const c2g = parseInt(config.color2.slice(3, 5), 16) / 255;
    const c2b = parseInt(config.color2.slice(5, 7), 16) / 255;
    const c3r = parseInt(config.color3.slice(1, 3), 16) / 255;
    const c3g = parseInt(config.color3.slice(3, 5), 16) / 255;
    const c3b = parseInt(config.color3.slice(5, 7), 16) / 255;

    for (let j = colorStart; j < colorEnd; j += 1) {
      const vi = j * 3;
      const spd = Math.sqrt(
        vel[vi] * vel[vi] +
          vel[vi + 1] * vel[vi + 1] +
          vel[vi + 2] * vel[vi + 2]
      );
      let tVal = Math.min(1, spd / peakSpd);
      tVal = tVal * tVal * (3 - 2 * tVal);

      let r;
      let g;
      let b;
      if (tVal < 0.5) {
        const u = tVal * 2;
        r = c1r + (c2r - c1r) * u;
        g = c1g + (c2g - c1g) * u;
        b = c1b + (c2b - c1b) * u;
      } else {
        const u = (tVal - 0.5) * 2;
        r = c2r + (c3r - c2r) * u;
        g = c2g + (c3g - c2g) * u;
        b = c2b + (c3b - c2b) * u;
      }

      colors[vi] = r;
      colors[vi + 1] = g;
      colors[vi + 2] = b;
    }
    colorAttr.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
      if (geometryRef.current) geometryRef.current.dispose();
    };
  }, [texture]);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry ref={geometryRef} />
        <pointsMaterial
          size={config.pointSize}
          vertexColors
          transparent
          opacity={config.opacity}
          map={texture || undefined}
          alphaTest={0.01}
          blending={THREE.NormalBlending}
          depthWrite
          depthTest
        />
      </points>
    </group>
  );
}
