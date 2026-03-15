import * as THREE from 'three';

import React, { useMemo } from 'react';

/* -------------------------------------------------------
   MiniNeuralNet — tiny static approximation of NeuralNetwork.
   25 deterministic particles on a ring, connected by short edges.
   No animation; renders points + lineSegments for the plotter.
------------------------------------------------------- */
export default function MiniNeuralNet() {
  const { ptPositions, ptCount, linePositions, lineColors, lineCount } =
    useMemo(() => {
      const N = 25;
      const pts = [];

      // Deterministic ring with vertical wobble — no Math.random()
      for (let i = 0; i < N; i += 1) {
        const theta = (i / N) * Math.PI * 2;
        const r = 1.2 + 0.4 * Math.abs(Math.sin(i * 1.3));
        const y = 0.6 * Math.sin(i * 0.8 + 1.0);
        pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
      }

      const ptPos = new Float32Array(N * 3);
      pts.forEach(([x, y, z], i) => {
        ptPos[i * 3] = x;
        ptPos[i * 3 + 1] = y;
        ptPos[i * 3 + 2] = z;
      });

      const maxDist = 1.8;
      const linePosArr = [];
      const lineColArr = [];

      for (let i = 0; i < N; i += 1) {
        for (let j = i + 1; j < N; j += 1) {
          const dx = pts[i][0] - pts[j][0];
          const dy = pts[i][1] - pts[j][1];
          const dz = pts[i][2] - pts[j][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < maxDist) {
            const alpha = 1 - dist / maxDist;
            linePosArr.push(...pts[i], ...pts[j]);
            lineColArr.push(alpha, alpha, alpha, alpha, alpha, alpha);
          }
        }
      }

      return {
        ptPositions: ptPos,
        ptCount: N,
        linePositions: new Float32Array(linePosArr),
        lineColors: new Float32Array(lineColArr),
        lineCount: linePosArr.length / 3,
      };
    }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ptPositions, 3]}
            count={ptCount}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#88ccff"
          size={3}
          sizeAttenuation={false}
          side={THREE.DoubleSide}
        />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={lineCount}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
            count={lineCount}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors side={THREE.DoubleSide} />
      </lineSegments>
    </group>
  );
}
