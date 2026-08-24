import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { button, useControls } from 'leva';
import * as THREE from 'three';

import Attractors from '@elements/Attractors/Attractors';
import algorithms, { INITIAL_ATTRACTORS } from '@utils/particleAlgorithms';

import useParticleLabControls from './useParticleLabControls';

const BLENDING_MODES = {
  Additive: THREE.AdditiveBlending,
  Normal: THREE.NormalBlending,
  Subtractive: THREE.SubtractiveBlending,
  Multiply: THREE.MultiplyBlending,
};

const PREMULTIPLIED_ALPHA_REQUIRED_MODES = new Set(['Subtractive', 'Multiply']);

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const MAX_ATTRACTORS = 8;

// ---------------------------------------------------------------------------
// Particle cloud renderer
// ---------------------------------------------------------------------------

function ParticleCloud({ config, attractorsRef, scaleRef }) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const texture = useMemo(createCircleTexture, []);
  const alignedPositionsRef = useRef(null);
  const wasAnimatingRef = useRef(false);
  const currentCentroidRef = useRef(new THREE.Vector3());
  const simStateRef = useRef(null);
  const scaleFactorRef = scaleRef;

  // Sim-type: create mutable physics state (only resets on algo/count change,
  // NOT on param slider tweaks so the simulation stays alive while tuning).
  useEffect(() => {
    const alg = algorithms[config.algorithm];
    if (alg.type === 'sim' && alg.createSimState) {
      simStateRef.current = alg.createSimState(config.pointsCount);
    } else {
      simStateRef.current = null;
    }
  }, [config.algorithm, config.pointsCount]);

  useEffect(() => {
    const alg = algorithms[config.algorithm];
    const rawPositions = [];
    const colors = new Float32Array(config.pointsCount * 3);

    alg.generate(config.params, rawPositions, config.pointsCount);

    if (rawPositions.length === 0 || !geometryRef.current) return;

    const actualCount = rawPositions.length / 3;
    const centroid = currentCentroidRef.current;
    centroid.set(0, 0, 0);

    for (let i = 0; i < rawPositions.length; i += 3) {
      centroid.x += rawPositions[i];
      centroid.y += rawPositions[i + 1];
      centroid.z += rawPositions[i + 2];
    }
    centroid.divideScalar(actualCount);

    let maxDist = 0;
    for (let i = 0; i < rawPositions.length; i += 3) {
      const dx = rawPositions[i] - centroid.x;
      const dy = rawPositions[i + 1] - centroid.y;
      const dz = rawPositions[i + 2] - centroid.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > maxDist) maxDist = d;
    }

    const currentScaleFactor = 15.0 / (maxDist || 1.0);
    scaleFactorRef.current = currentScaleFactor;

    const alignedPositions = new Float32Array(rawPositions.length);
    alignedPositionsRef.current = alignedPositions;

    const c1 = new THREE.Color(config.color1);
    const c2 = new THREE.Color(config.color2);
    const c3 = new THREE.Color(config.color3);

    for (let i = 0; i < rawPositions.length; i += 3) {
      const bx = (rawPositions[i] - centroid.x) * currentScaleFactor;
      const by = (rawPositions[i + 1] - centroid.y) * currentScaleFactor;
      const bz = (rawPositions[i + 2] - centroid.z) * currentScaleFactor;

      alignedPositions[i] = bx;
      alignedPositions[i + 1] = by;
      alignedPositions[i + 2] = bz;

      const distNorm = Math.sqrt(bx * bx + by * by + bz * bz) / 15.0;
      const timeNorm = i / 3 / actualCount;

      let t = distNorm * 0.4 + timeNorm * 0.6;
      t = Math.max(0, Math.min(1, t));

      const col =
        t < 0.5
          ? c1.clone().lerp(c2, t * 2.0)
          : c2.clone().lerp(c3, (t - 0.5) * 2.0);

      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }

    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(alignedPositions), 3)
    );
    geometryRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;

    wasAnimatingRef.current = false;
  }, [
    config.algorithm,
    config.paramsKey,
    config.pointsCount,
    config.color1,
    config.color2,
    config.color3,
  ]);

  useFrame(() => {
    const points = pointsRef.current;
    const geometry = geometryRef.current;
    const alignedPositions = alignedPositionsRef.current;

    if (!points || !geometry || !alignedPositions) return;

    const positionAttr = geometry.attributes.position;
    if (!positionAttr) return;

    if (config.animatePoints) {
      wasAnimatingRef.current = true;
      const positions = positionAttr.array;
      const len = alignedPositions.length;
      const alg = algorithms[config.algorithm];
      const { type } = alg;
      const pointCount = len / 3;

      if (type === 'sim') {
        const sim = simStateRef.current;
        if (!sim || !alg.update) return;

        // Advance physics
        alg.update(sim, config.params, attractorsRef && attractorsRef.current);

        // Write scaled sim positions to the display buffer
        const scale = scaleFactorRef.current;
        const simPos = sim.positions;
        const writeLen = Math.min(positions.length, simPos.length);
        for (let i = 0; i < writeLen; i += 1) {
          positions[i] = simPos[i] * scale;
        }
        positionAttr.needsUpdate = true;

        // Velocity-based coloring: slow → color1, mid → color2, fast → color3
        // Time-slice coloring to match sim slicing — only recolor updated
        // particles each frame, avoiding 65k sqrt + lerp ops per frame.
        const colorAttr = geometry.attributes.color;
        if (colorAttr && sim.frameCounter != null) {
          const colors = colorAttr.array;
          const vel = sim.velocities;
          const count = sim.masses.length;

          // Match the sim's slice boundaries
          const SLICES = 4;
          const slice = (sim.frameCounter - 1 + SLICES) % SLICES;
          const colorStart = Math.floor((count * slice) / SLICES);
          const colorEnd = Math.floor((count * (slice + 1)) / SLICES);

          // Find peak speed in this slice so the colour ramp adapts to the
          // actual velocity distribution instead of the theoretical maxSpeed
          // (which particles rarely approach in low-energy sims like Mycelium).
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

          const c1r = (parseInt(config.color1.slice(1, 3), 16) || 0) / 255;
          const c1g = (parseInt(config.color1.slice(3, 5), 16) || 0) / 255;
          const c1b = (parseInt(config.color1.slice(5, 7), 16) || 0) / 255;
          const c2r = (parseInt(config.color2.slice(1, 3), 16) || 0) / 255;
          const c2g = (parseInt(config.color2.slice(3, 5), 16) || 0) / 255;
          const c2b = (parseInt(config.color2.slice(5, 7), 16) || 0) / 255;
          const c3r = (parseInt(config.color3.slice(1, 3), 16) || 0) / 255;
          const c3g = (parseInt(config.color3.slice(3, 5), 16) || 0) / 255;
          const c3b = (parseInt(config.color3.slice(5, 7), 16) || 0) / 255;

          for (let j = colorStart; j < colorEnd; j += 1) {
            const vi = j * 3;
            const spd = Math.sqrt(
              vel[vi] * vel[vi] +
                vel[vi + 1] * vel[vi + 1] +
                vel[vi + 2] * vel[vi + 2]
            );
            let t = Math.min(1, spd / peakSpd);
            t = t * t * (3 - 2 * t);

            let r;
            let g;
            let b;
            if (t < 0.5) {
              const u = t * 2;
              r = c1r + (c2r - c1r) * u;
              g = c1g + (c2g - c1g) * u;
              b = c1b + (c2b - c1b) * u;
            } else {
              const u = (t - 0.5) * 2;
              r = c2r + (c3r - c2r) * u;
              g = c2g + (c3g - c2g) * u;
              b = c2b + (c3b - c2b) * u;
            }

            colors[vi] = r;
            colors[vi + 1] = g;
            colors[vi + 2] = b;
          }
          colorAttr.needsUpdate = true;
        }
        return;
      }

      const time = performance.now() * 0.001;

      if (type === 'ode') {
        const flowSpeed = Math.max(1, Math.floor(pointCount * 0.05));
        const offset = Math.floor(time * flowSpeed);

        const dashLength = Math.max(1, Math.floor(pointCount * 0.015));
        const gapLength = Math.max(1, Math.floor(pointCount * 0.03));
        const patternLength = dashLength + gapLength;

        for (let i = 0; i < len; i += 3) {
          const ptIdx = i / 3;

          if (ptIdx % patternLength < dashLength) {
            const trackIdx = (ptIdx + offset) % pointCount;
            const srcI = trackIdx * 3;
            positions[i] = alignedPositions[srcI];
            positions[i + 1] = alignedPositions[srcI + 1];
            positions[i + 2] = alignedPositions[srcI + 2];
          } else {
            positions[i] = 999999;
            positions[i + 1] = 999999;
            positions[i + 2] = 999999;
          }
        }
      } else {
        const speed = 0.4;
        const amp = 0.25;

        for (let i = 0; i < len; i += 3) {
          const bx = alignedPositions[i];
          const by = alignedPositions[i + 1];
          const bz = alignedPositions[i + 2];

          positions[i] = bx + Math.sin(time * speed + by) * amp;
          positions[i + 1] = by + Math.cos(time * speed * 1.1 + bz) * amp;
          positions[i + 2] = bz + Math.sin(time * speed * 0.9 + bx) * amp;
        }
      }

      positionAttr.needsUpdate = true;
    } else if (wasAnimatingRef.current) {
      // For sim-type algorithms (e.g. Gravity Attractors) leave the current
      // display positions untouched so the simulation visually pauses in place
      // instead of snapping back to the initial particle field.
      const alg = algorithms[config.algorithm];
      if (alg.type !== 'sim') {
        const positions = positionAttr.array;
        for (let i = 0; i < positions.length; i += 1) {
          positions[i] = alignedPositions[i];
        }
        positionAttr.needsUpdate = true;
      }
      wasAnimatingRef.current = false;
    }
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
      if (geometryRef.current) geometryRef.current.dispose();
    };
  }, [texture]);

  return (
    <points
      ref={pointsRef}
      rotation={[
        config.rotationRadians.x,
        config.rotationRadians.y,
        config.rotationRadians.z,
      ]}
    >
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={config.pointSize}
        vertexColors
        transparent={config.transparent}
        opacity={config.opacity}
        map={texture || undefined}
        alphaTest={config.alphaTest}
        blending={BLENDING_MODES[config.blendingMode] ?? THREE.AdditiveBlending}
        depthWrite={config.depthWrite}
        depthTest={config.depthTest}
        premultipliedAlpha={
          config.premultipliedAlpha ||
          PREMULTIPLIED_ALPHA_REQUIRED_MODES.has(config.blendingMode)
        }
      />
    </points>
  );
}

export default function ParticleLab() {
  const config = useParticleLabControls();
  const scaleRef = useRef(1);
  const attractorsRef = useRef(
    INITIAL_ATTRACTORS.map((a) => ({
      position: [...a.position],
      direction: [...a.direction],
      type: a.type || 'attractor',
    }))
  );
  const [attractorVersion, setAttractorVersion] = useState(0);
  const isValidVec3 = useCallback(
    (v) =>
      Array.isArray(v) && v.length === 3 && v.every((n) => Number.isFinite(n)),
    []
  );

  // World-space attractor copies for the visual markers (scaled up).
  const worldAttractorsRef = useRef([]);
  useEffect(() => {
    const s = scaleRef.current;
    worldAttractorsRef.current = attractorsRef.current.map((a) => {
      let pos = a.position;
      if (!isValidVec3(pos)) {
        pos = [0, 0, 0];
      }
      return {
        position: [pos[0] * s, pos[1] * s, pos[2] * s],
        direction: isValidVec3(a.direction) ? [...a.direction] : [0, 1, 0],
        rotation: [0, 0, 0],
      };
    });
  }, [attractorVersion, isValidVec3]);

  // Convert world-space marker drag back to normalised attractor data.
  const handleAttractorUpdate = useCallback(
    (idx, { position, direction, ...rest }) => {
      const invS = 1 / (scaleRef.current || 1);
      const current = attractorsRef.current[idx] || {};

      let nextPosWorld = null;
      if (isValidVec3(position)) {
        nextPosWorld = position;
      } else if (isValidVec3(current.position)) {
        nextPosWorld = [
          current.position[0] * scaleRef.current,
          current.position[1] * scaleRef.current,
          current.position[2] * scaleRef.current,
        ];
      } else {
        nextPosWorld = [0, 0, 0];
      }

      let nextDir = [0, 1, 0];
      if (isValidVec3(direction)) {
        nextDir = direction;
      } else if (isValidVec3(current.direction)) {
        nextDir = current.direction;
      }

      attractorsRef.current[idx] = {
        ...current,
        ...rest,
        position: [
          nextPosWorld[0] * invS,
          nextPosWorld[1] * invS,
          nextPosWorld[2] * invS,
        ],
        direction: nextDir,
      };
    },
    [isValidVec3]
  );

  const { controlsMode, showHelpers } = useControls(
    'Attractors',
    {
      controlsMode: {
        label: 'Mode',
        value: 'translate',
        options: ['both', 'translate', 'rotate', 'none'],
      },
      showHelpers: { label: 'Show Helpers', value: true },
      addAttractor: button(() => {
        if (attractorsRef.current.length >= MAX_ATTRACTORS) return;
        attractorsRef.current.push({
          position: [Math.random() * 2 - 1, 0, Math.random() * 2 - 1],
          direction: [0, 1, 0],
          type: 'attractor',
        });
        setAttractorVersion((c) => c + 1);
      }),
      removeAttractor: button(() => {
        if (attractorsRef.current.length <= 1) return;
        attractorsRef.current.pop();
        setAttractorVersion((c) => c + 1);
      }),
    },
    {
      render: () => config.algorithm === 'Gravity Attractors',
    }
  );

  return (
    <>
      <color attach="background" args={[config.backgroundColor]} />
      <fog attach="fog" args={[config.backgroundColor, 0.015]} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={45} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        autoRotate={config.autoRotate}
        autoRotateSpeed={config.autoRotateSpeed}
      />
      <ParticleCloud
        config={config}
        attractorsRef={attractorsRef}
        scaleRef={scaleRef}
      />
      {config.algorithm === 'Gravity Attractors' && (
        <Attractors
          attractorsRef={worldAttractorsRef}
          mode={controlsMode}
          visible={showHelpers}
          markerSize={0.12}
          controlsSize={0.5}
          version={attractorVersion}
          onUpdate={handleAttractorUpdate}
        />
      )}
    </>
  );
}
