import { button, useControls } from 'leva';
import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import algorithms, { INITIAL_ATTRACTORS } from './particleAlgorithms';
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

// ---------------------------------------------------------------------------
// Attractor helpers — draggable 3D markers for the Gravity Attractors sim
// ---------------------------------------------------------------------------

const MAX_ATTRACTORS = 8;
const ATTRACTOR_COLORS = [
  '#ff4466',
  '#44ff66',
  '#4488ff',
  '#ffdd44',
  '#ff44ff',
  '#44ffff',
  '#ff8844',
  '#88ff44',
];

/** Single draggable attractor marker with spin-axis indicator. */
function AttractorHandle({
  index,
  initialPosition,
  initialAxis,
  mode,
  onUpdate,
  orbitRef,
  scaleRef,
}) {
  const groupRef = useRef();
  const translateControlsRef = useRef();
  const rotateControlsRef = useRef();
  const [ready, setReady] = useState(false);

  // Set position / quaternion imperatively so React re-renders never
  // overwrite values that TransformControls has changed via dragging.
  useEffect(() => {
    if (!groupRef.current) return;
    const s = scaleRef.current;
    groupRef.current.position.set(
      initialPosition[0] * s,
      initialPosition[1] * s,
      initialPosition[2] * s
    );
    const axis = new THREE.Vector3(...initialAxis).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    if (
      axis.distanceTo(up) > 0.001 &&
      axis.distanceTo(up.clone().negate()) > 0.001
    ) {
      groupRef.current.quaternion.setFromUnitVectors(up, axis);
    }
    setReady(true);
    // eslint-disable-next-line no-empty-pattern
  }, []); // intentionally mount-only

  // Wire TransformControls events → orbit toggle + attractor data update.
  useEffect(() => {
    const tcTranslate = translateControlsRef.current;
    const tcRotate = rotateControlsRef.current;
    const refs = [tcTranslate, tcRotate].filter(Boolean);
    if (refs.length === 0) return undefined;

    const onDrag = (event) => {
      const orbit = orbitRef.current;
      if (orbit) {
        // eslint-disable-next-line no-param-reassign
        orbit.enabled = !event.value;
      }
    };
    const onChange = () => {
      if (!groupRef.current) return;
      const p = groupRef.current.position;
      const invS = 1 / (scaleRef.current || 1);
      const a = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(groupRef.current.quaternion)
        .normalize();
      onUpdate(index, [p.x * invS, p.y * invS, p.z * invS], [a.x, a.y, a.z]);
    };

    refs.forEach((tc) => {
      tc.addEventListener('dragging-changed', onDrag);
      tc.addEventListener('objectChange', onChange);
    });
    return () => {
      refs.forEach((tc) => {
        tc.removeEventListener('dragging-changed', onDrag);
        tc.removeEventListener('objectChange', onChange);
      });
    };
  }, [ready, mode, index, onUpdate, orbitRef, scaleRef]);

  const clr = ATTRACTOR_COLORS[index % ATTRACTOR_COLORS.length];

  return (
    <>
      <group ref={groupRef}>
        {/* marker sphere */}
        <mesh>
          <icosahedronGeometry args={[0.12, 2]} />
          <meshBasicMaterial
            color={clr}
            transparent
            opacity={0.7}
            depthTest={false}
          />
        </mesh>
        {/* spin-axis cone */}
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.04, 0.15, 8]} />
          <meshBasicMaterial color={clr} depthTest={false} />
        </mesh>
      </group>
      {ready && (mode === 'translate' || mode === 'both') && (
        <TransformControls
          ref={translateControlsRef}
          object={groupRef.current}
          mode="translate"
          size={0.5}
        />
      )}
      {ready && (mode === 'rotate' || mode === 'both') && (
        <TransformControls
          ref={rotateControlsRef}
          object={groupRef.current}
          mode="rotate"
          size={0.5}
        />
      )}
    </>
  );
}

/** Leva panel + visual helpers for managing attractors in the viewport. */
function AttractorManager({ attractorsRef, orbitRef, scaleRef }) {
  const [, forceUpdate] = useState(0);

  const { controlsMode, showHelpers } = useControls('Attractors', {
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
        axis: [0, 1, 0],
      });
      forceUpdate((c) => c + 1);
    }),
    removeAttractor: button(() => {
      if (attractorsRef.current.length <= 1) return;
      attractorsRef.current.pop();
      forceUpdate((c) => c + 1);
    }),
  });

  const handleUpdate = useCallback(
    (idx, position, axis) => {
      // eslint-disable-next-line no-param-reassign
      attractorsRef.current[idx] = { position, axis };
    },
    [attractorsRef]
  );

  if (!showHelpers) return null;

  return (
    <>
      {attractorsRef.current.map((attr, i) => (
        <AttractorHandle
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          index={i}
          initialPosition={attr.position}
          initialAxis={attr.axis}
          mode={controlsMode}
          onUpdate={handleUpdate}
          orbitRef={orbitRef}
          scaleRef={scaleRef}
        />
      ))}
    </>
  );
}

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
        const colorAttr = geometry.attributes.color;
        if (colorAttr) {
          const colors = colorAttr.array;
          const vel = sim.velocities;
          const maxSpd = config.params.maxSpeed || 8;
          const c1 = new THREE.Color(config.color1);
          const c2 = new THREE.Color(config.color2);
          const c3 = new THREE.Color(config.color3);
          const count = sim.masses.length;

          for (let j = 0; j < count; j += 1) {
            const vi = j * 3;
            const spd = Math.sqrt(
              vel[vi] * vel[vi] +
                vel[vi + 1] * vel[vi + 1] +
                vel[vi + 2] * vel[vi + 2]
            );
            // smoothstep-style mapping: speed/maxSpeed remapped through [0,0.5]→[0,1]
            let t = Math.min(1, Math.max(0, (spd / maxSpd) * 2));
            t = t * t * (3 - 2 * t);

            let r;
            let g;
            let b;
            if (t < 0.5) {
              const u = t * 2;
              r = c1.r + (c2.r - c1.r) * u;
              g = c1.g + (c2.g - c1.g) * u;
              b = c1.b + (c2.b - c1.b) * u;
            } else {
              const u = (t - 0.5) * 2;
              r = c2.r + (c3.r - c2.r) * u;
              g = c2.g + (c3.g - c2.g) * u;
              b = c2.b + (c3.b - c2.b) * u;
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
      const positions = positionAttr.array;
      for (let i = 0; i < positions.length; i += 1) {
        positions[i] = alignedPositions[i];
      }
      positionAttr.needsUpdate = true;
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
  const orbitRef = useRef();
  const scaleRef = useRef(1);
  const attractorsRef = useRef(
    INITIAL_ATTRACTORS.map((a) => ({
      position: [...a.position],
      axis: [...a.axis],
    }))
  );

  return (
    <>
      <color attach="background" args={[config.backgroundColor]} />
      <fog attach="fog" args={[config.backgroundColor, 0.015]} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={45} />
      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.05}
        autoRotate={false}
      />
      <ParticleCloud
        config={config}
        attractorsRef={attractorsRef}
        scaleRef={scaleRef}
      />
      {config.algorithm === 'Gravity Attractors' && (
        <AttractorManager
          attractorsRef={attractorsRef}
          orbitRef={orbitRef}
          scaleRef={scaleRef}
        />
      )}
    </>
  );
}
