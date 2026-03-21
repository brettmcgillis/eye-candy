/* eslint-disable no-continue */

/* eslint-disable no-plusplus */
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DynamicDrawUsage,
  MultiplyBlending,
  NormalBlending,
  Object3D,
  SubtractiveBlending,
} from 'three';

import React, { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

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
  shape = 'ring',

  innerDiameter = 6,
  outerDiameter = 18,
  height = 0,

  networkWidth = outerDiameter,
  networkHeight = height > 0 ? height : outerDiameter,
  networkDepth = outerDiameter,

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
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;

  const groupRef = useRef();
  const particlesRef = useRef();
  const particlesMeshRef = useRef();
  const linesGeometryRef = useRef();

  const particlesData = useRef([]);
  const instanceDummy = useRef(new Object3D());

  const particlePositions = useRef();
  const linePositions = useRef();
  const lineColors = useRef();

  const innerR = innerDiameter * 0.5;
  const outerR = outerDiameter * 0.5;

  const safeMinConnections = Math.max(0, minConnections);
  const safeMaxConnections = Math.max(safeMinConnections, maxConnections);
  const safeParticleCount = Math.min(particleCount, maxParticleCount);
  const normalizedShape =
    shape === 'sphere' || shape === 'network' ? shape : 'ring';
  const meshPointScale = Math.max(pointSize, 0.1) * 0.01;

  /* ---------------------------------------------
     HARD RESET
  ----------------------------------------------*/

  useEffect(() => {
    const maxSegments = maxParticleCount * maxParticleCount;
    const widthHalf = Math.max(networkWidth, 0) * 0.5;
    const heightHalf = Math.max(networkHeight, 0) * 0.5;
    const depthHalf = Math.max(networkDepth, 0) * 0.5;

    particlePositions.current = new Float32Array(maxParticleCount * 3);
    linePositions.current = new Float32Array(maxSegments * 3);
    lineColors.current = new Float32Array(maxSegments * 3);

    particlesData.current = [];

    for (let i = 0; i < maxParticleCount; i++) {
      if (normalizedShape === 'ring') {
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
          mode: 'ring',
          theta: t,
          radius: r,
          y,
          angularVelocity: speed * (Math.random() < 0.5 ? -1 : 1),
          radialVelocity: (Math.random() - 0.5) * 0.002,
          verticalPhase: Math.random() * Math.PI * 2,
          verticalSpeed: 0.3 + Math.random() * 0.4,
          numConnections: 0,
        });
        continue;
      }

      if (normalizedShape === 'sphere') {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.max(outerR, 0.0001);

        const sinPhi = Math.sin(phi);
        const x = radius * sinPhi * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * sinPhi * Math.sin(theta);

        particlePositions.current.set([x, y, z], i * 3);

        particlesData.current.push({
          mode: 'sphere',
          theta,
          phi,
          radius,
          thetaVelocity: (Math.random() - 0.5) * 0.6,
          phiVelocity: (Math.random() - 0.5) * 0.3,
          numConnections: 0,
        });
        continue;
      }

      const x = (Math.random() * 2 - 1) * widthHalf;
      const y = (Math.random() * 2 - 1) * heightHalf;
      const z = (Math.random() * 2 - 1) * depthHalf;

      particlePositions.current.set([x, y, z], i * 3);

      particlesData.current.push({
        mode: 'network',
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.03,
        vy: (Math.random() - 0.5) * 0.03,
        vz: (Math.random() - 0.5) * 0.03,
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

    pGeo.setDrawRange(0, safeParticleCount);
    lGeo.setDrawRange(0, 0);

    pGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;
  }, [
    maxParticleCount,
    safeParticleCount,
    innerDiameter,
    outerDiameter,
    height,
    normalizedShape,
    networkWidth,
    networkHeight,
    networkDepth,
  ]);

  /* ---------------------------------------------
     Cheap update
  ----------------------------------------------*/

  useEffect(() => {
    if (particlesRef.current)
      particlesRef.current.setDrawRange(0, safeParticleCount);

    if (particlesMeshRef.current) {
      particlesMeshRef.current.count = safeParticleCount;
    }
  }, [safeParticleCount]);

  useEffect(() => {
    if (particlesMeshRef.current?.instanceMatrix) {
      particlesMeshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }
  }, []);

  /* ---------------------------------------------
     FRAME LOOP
  ----------------------------------------------*/

  useFrame((_, delta) => {
    if (!particlePositions.current) return;

    const dt = delta * timeScale;
    const widthHalf = Math.max(networkWidth, 0) * 0.5;
    const heightHalf = Math.max(networkHeight, 0) * 0.5;
    const depthHalf = Math.max(networkDepth, 0) * 0.5;

    let vertexpos = 0;
    let colorpos = 0;

    const pos = particlePositions.current;
    const data = particlesData.current;

    /* -------- reset counts -------- */

    for (let i = 0; i < safeParticleCount; i++) data[i].numConnections = 0;

    /* -------- integrate motion -------- */

    for (let i = 0; i < safeParticleCount; i++) {
      const p = data[i];

      if (p.mode === 'ring') {
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

        pos[i * 3] = Math.cos(p.theta) * p.radius;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(p.theta) * p.radius;
        continue;
      }

      if (p.mode === 'sphere') {
        p.theta += p.thetaVelocity * dt * angularSpeed;
        p.phi += p.phiVelocity * dt * verticalSpeed;

        if (p.phi < 0) {
          p.phi = -p.phi;
          p.phiVelocity *= -1;
        }
        if (p.phi > Math.PI) {
          p.phi = Math.PI * 2 - p.phi;
          p.phiVelocity *= -1;
        }

        const sinPhi = Math.sin(p.phi);

        pos[i * 3] = p.radius * sinPhi * Math.cos(p.theta);
        pos[i * 3 + 1] = p.radius * Math.cos(p.phi);
        pos[i * 3 + 2] = p.radius * sinPhi * Math.sin(p.theta);
        continue;
      }

      p.x += p.vx * dt * 60 * radialSpeed;
      p.y += p.vy * dt * 60 * verticalSpeed;
      p.z += p.vz * dt * 60 * angularSpeed;

      if (p.x < -widthHalf) {
        p.x = -widthHalf;
        p.vx *= -1;
      }
      if (p.x > widthHalf) {
        p.x = widthHalf;
        p.vx *= -1;
      }

      if (p.y < -heightHalf) {
        p.y = -heightHalf;
        p.vy *= -1;
      }
      if (p.y > heightHalf) {
        p.y = heightHalf;
        p.vy *= -1;
      }

      if (p.z < -depthHalf) {
        p.z = -depthHalf;
        p.vz *= -1;
      }
      if (p.z > depthHalf) {
        p.z = depthHalf;
        p.vz *= -1;
      }

      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    }

    /* -------- build candidate edge list -------- */

    const edges = [];

    for (let i = 0; i < safeParticleCount; i++) {
      for (let j = i + 1; j < safeParticleCount; j++) {
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
        (a.numConnections < safeMinConnections ||
          b.numConnections < safeMinConnections) &&
        a.numConnections < safeMaxConnections &&
        b.numConnections < safeMaxConnections
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
        a.numConnections < safeMaxConnections &&
        b.numConnections < safeMaxConnections
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

    if (isWebGPU && particlesMeshRef.current) {
      const mesh = particlesMeshRef.current;
      const dummy = instanceDummy.current;

      for (let i = 0; i < safeParticleCount; i++) {
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.scale.setScalar(meshPointScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.count = safeParticleCount;
      mesh.instanceMatrix.needsUpdate = true;
    }

    groupRef.current.rotation.y += dt * 0.03 * systemRotation;
  });

  /* ---------------------------------------------
     RENDER
  ----------------------------------------------*/

  return (
    <group ref={groupRef} dispose={null}>
      <points visible={!isWebGPU}>
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

      <instancedMesh
        ref={particlesMeshRef}
        args={[null, null, maxParticleCount]}
        visible={isWebGPU}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={new Color(pointColor)}
          transparent={pointsTransparent}
          opacity={pointsOpacity}
          toneMapped={pointsToneMapped}
          blending={BLENDING[pointBlending] ?? NormalBlending}
          depthWrite={false}
        />
      </instancedMesh>

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
