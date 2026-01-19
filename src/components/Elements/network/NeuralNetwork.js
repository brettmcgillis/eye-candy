/* eslint-disable no-continue */

/* eslint-disable no-plusplus */
import React, { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  MultiplyBlending,
  NormalBlending,
  SubtractiveBlending,
} from 'three';

import { useFrame } from '@react-three/fiber';

/* ---------------------------------------------
   Blending resolver (safe for Leva)
----------------------------------------------*/

const BLENDING = {
  normal: NormalBlending,
  additive: AdditiveBlending,
  multiply: MultiplyBlending,
  subtractive: SubtractiveBlending,
};

export default function NeuralNetwork({
  innerDiameter = 6,
  outerDiameter = 18,
  height = 0,

  maxParticleCount = 1000,
  particleCount = 500,

  minConnections = 1,
  maxConnections = 8,

  minDistance = 0.8,
  maxDistance = 2.4,

  pointColor = '#ffffff',
  lineColor = '#88ccff',
  pointSize = 2.5,
  lineWidth = 1,

  /* ---------- visual controls ---------- */

  pointBlending = 'normal',
  lineBlending = 'normal',

  pointsToneMapped = false,
  linesToneMapped = false,

  pointsTransparent = true,
  linesTransparent = true,

  pointsOpacity = 1,
  linesOpacity = 1,

  /* ---------- simulation speed ---------- */

  timeScale = 1,
  angularSpeed = 1,
  radialSpeed = 1,
  verticalSpeed = 1,
  systemRotation = 1,
}) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const linesGeometryRef = useRef();

  const particlesData = useRef([]);

  const particlePositions = useRef();
  const linePositions = useRef();
  const lineColors = useRef();

  const innerR = innerDiameter * 0.5;
  const outerR = outerDiameter * 0.5;

  /* ---------------------------------------------
     HARD RESET
  ----------------------------------------------*/

  useEffect(() => {
    const maxSegments = maxParticleCount * maxParticleCount;

    particlePositions.current = new Float32Array(maxParticleCount * 3);
    linePositions.current = new Float32Array(maxSegments * 3);
    lineColors.current = new Float32Array(maxSegments * 3);

    particlesData.current = [];

    for (let i = 0; i < maxParticleCount; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = innerR + Math.random() * (outerR - innerR);
      const y = (Math.random() - 0.5) * height;

      const speed =
        (0.15 + Math.random() * 0.25) * (innerR / Math.max(r, 0.0001));

      particlePositions.current.set(
        [Math.cos(t) * r, y, Math.sin(t) * r],
        i * 3
      );

      particlesData.current.push({
        theta: t,
        radius: r,
        y,
        angularVelocity: speed * (Math.random() < 0.5 ? -1 : 1),
        radialVelocity: (Math.random() - 0.5) * 0.002,
        verticalPhase: Math.random() * Math.PI * 2,
        verticalSpeed: 0.3 + Math.random() * 0.4,
        numConnections: 0,
      });
    }

    const pGeo = particlesRef.current;
    const lGeo = linesGeometryRef.current;

    pGeo.setAttribute(
      'position',
      new BufferAttribute(particlePositions.current, 3)
    );

    lGeo.setAttribute(
      'position',
      new BufferAttribute(linePositions.current, 3)
    );

    lGeo.setAttribute('color', new BufferAttribute(lineColors.current, 3));

    pGeo.setDrawRange(0, particleCount);
    lGeo.setDrawRange(0, 0);

    pGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;
  }, [maxParticleCount, innerDiameter, outerDiameter, height]);

  /* ---------------------------------------------
     Cheap update
  ----------------------------------------------*/

  useEffect(() => {
    if (particlesRef.current)
      particlesRef.current.setDrawRange(0, particleCount);
  }, [particleCount]);

  /* ---------------------------------------------
     FRAME LOOP
  ----------------------------------------------*/

  useFrame((_, delta) => {
    if (!particlePositions.current) return;

    const dt = delta * timeScale;

    let vertexpos = 0;
    let colorpos = 0;

    const pos = particlePositions.current;
    const data = particlesData.current;

    /* -------- reset counts -------- */

    for (let i = 0; i < particleCount; i++) data[i].numConnections = 0;

    /* -------- integrate motion -------- */

    for (let i = 0; i < particleCount; i++) {
      const p = data[i];

      p.theta += p.angularVelocity * dt * 2 * angularSpeed;
      p.radius += p.radialVelocity * dt * 60 * radialSpeed;

      if (p.radius < innerR) {
        p.radius = innerR;
        p.radialVelocity *= -1;
      }
      if (p.radius > outerR) {
        p.radius = outerR;
        p.radialVelocity *= -1;
      }

      p.verticalPhase += dt * p.verticalSpeed * verticalSpeed;
      const y = p.y + Math.sin(p.verticalPhase) * height * 0.15;

      /* -------- apply virtual insanity -------- */

      pos[i * 3] = Math.cos(p.theta) * p.radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(p.theta) * p.radius;
    }

    /* -------- build candidate edge list -------- */

    const edges = [];

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];

        /* -------- get the dist of my squirt -------- */

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist >= minDistance && dist <= maxDistance) {
          edges.push({ i, j, dist });
        }
      }
    }

    edges.sort((a, b) => a.dist - b.dist);

    const connect = (a, b, dist) => {
      const alpha = 1 - (dist - minDistance) / (maxDistance - minDistance);

      linePositions.current.set(
        [
          pos[a * 3],
          pos[a * 3 + 1],
          pos[a * 3 + 2],
          pos[b * 3],
          pos[b * 3 + 1],
          pos[b * 3 + 2],
        ],
        vertexpos
      );

      lineColors.current.set(
        [alpha, alpha, alpha, alpha, alpha, alpha],
        colorpos
      );

      vertexpos += 6;
      colorpos += 6;

      data[a].numConnections++;
      data[b].numConnections++;
    };

    /* -------- pass 1: satisfy minConnections -------- */

    for (let e = 0; e < edges.length; e++) {
      const { i, j, dist } = edges[e];

      const a = data[i];
      const b = data[j];

      if (
        (a.numConnections < minConnections ||
          b.numConnections < minConnections) &&
        a.numConnections < maxConnections &&
        b.numConnections < maxConnections
      ) {
        connect(i, j, dist);
      }
    }

    /* -------- pass 2: fill up to maxConnections -------- */

    for (let e = 0; e < edges.length; e++) {
      const { i, j, dist } = edges[e];

      const a = data[i];
      const b = data[j];

      if (
        a.numConnections < maxConnections &&
        b.numConnections < maxConnections
      ) {
        connect(i, j, dist);
      }
    }

    /* -------- upload -------- */

    const lg = linesGeometryRef.current;
    lg.setDrawRange(0, vertexpos / 3);
    lg.attributes.position.needsUpdate = true;
    lg.attributes.color.needsUpdate = true;

    particlesRef.current.attributes.position.needsUpdate = true;

    groupRef.current.rotation.y += dt * 0.03 * systemRotation;
  });

  /* ---------------------------------------------
     RENDER
  ----------------------------------------------*/

  return (
    <group ref={groupRef} dispose={null}>
      <points>
        <bufferGeometry ref={particlesRef} />
        <pointsMaterial
          color={new Color(pointColor)}
          size={pointSize}
          sizeAttenuation={false}
          blending={BLENDING[pointBlending] ?? NormalBlending}
          transparent={pointsTransparent}
          opacity={pointsOpacity}
          toneMapped={pointsToneMapped}
          depthWrite={false}
        />
      </points>

      <lineSegments>
        <bufferGeometry ref={linesGeometryRef} />
        <lineBasicMaterial
          color={new Color(lineColor)}
          linewidth={lineWidth}
          vertexColors
          blending={BLENDING[lineBlending] ?? NormalBlending}
          transparent={linesTransparent}
          opacity={linesOpacity}
          toneMapped={linesToneMapped}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
